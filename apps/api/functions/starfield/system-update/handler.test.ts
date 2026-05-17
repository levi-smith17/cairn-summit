import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id: string | undefined, body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/starfield/systems/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/systems/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/systems/{id}', rawPath: `/starfield/systems/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/system-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('updates system name and returns 200', async () => {
        const updated = { pk: 'SF#SYSTEM', sk: 'SYSTEM#sol', name: 'Sol Renamed' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('sol', { name: 'Sol Renamed' })) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('updates using SF#SYSTEM pk', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })
        await handler(mockEvent('sol', { name: 'Sol' }))
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'SF#SYSTEM', sk: 'SYSTEM#sol' },
                    ExpressionAttributeValues: { ':name': 'Sol' },
                }),
            })
        )
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined, { name: 'Sol' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing system id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent('sol', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name is required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('sol', { name: 'Sol' })) as any
        expect(result.statusCode).toBe(500)
    })
})
