import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string | undefined): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/starfield/networks/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /starfield/networks/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'DELETE /starfield/networks/{id}', rawPath: `/starfield/networks/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined, isBase64Encoded: false,
})

describe('starfield/network-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('deletes network and associated outposts, returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [
                { pk: 'USER#user-1', sk: 'SF#FACILITY#outpost-1' },
                { pk: 'USER#user-1', sk: 'SF#FACILITY#outpost-2' },
            ]})
            .mockResolvedValue({})

        const result = await handler(mockEvent('user-1', 'net-1')) as any
        expect(result.statusCode).toBe(204)
        // 1 query + 2 outpost deletes + 1 network delete = 4 calls
        expect(dynamo.send).toHaveBeenCalledTimes(4)
    })

    it('deletes network with no outposts', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('user-1', 'net-1')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledTimes(2)
    })

    it('deletes network with the correct key', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({})

        await handler(mockEvent('user-1', 'net-abc'))

        expect(dynamo.send).toHaveBeenLastCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'USER#user-1', sk: 'SF#NETWORK#net-abc' },
                }),
            })
        )
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-1', undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing network id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', 'net-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
