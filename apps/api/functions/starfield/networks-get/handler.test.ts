import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/starfield/networks', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /starfield/networks', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'GET /starfield/networks', rawPath: '/starfield/networks',
    rawQueryString: '', headers: {}, isBase64Encoded: false,
})

describe('starfield/networks-get handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns networks for the user', async () => {
        const networks = [
            { pk: 'USER#user-1', sk: 'SF#NETWORK#a', name: 'Alpha', abbreviation: 'AL' },
            { pk: 'USER#user-1', sk: 'SF#NETWORK#b', name: 'Beta', abbreviation: 'BE' },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: networks })

        const result = await handler(mockEvent('user-1')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(networks)
    })

    it('returns empty array when user has no networks', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        const result = await handler(mockEvent('user-1')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('queries with the correct user pk and SK prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        await handler(mockEvent('user-123'))
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    ExpressionAttributeValues: { ':pk': 'USER#user-123', ':prefix': 'SF#NETWORK#' },
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
