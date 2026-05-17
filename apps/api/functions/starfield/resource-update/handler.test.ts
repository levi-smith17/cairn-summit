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
        http: { method: 'PUT', path: `/starfield/resources/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/resources/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/resources/{id}', rawPath: `/starfield/resources/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/resource-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('updates resource fields and returns 200', async () => {
        const updated = { pk: 'SF#RESOURCE', sk: 'RESOURCE#res-1', name: 'Steel', abbreviation: 'St' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('res-1', { name: 'Steel' })) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('updates using SF#RESOURCE as pk', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })
        await handler(mockEvent('res-1', { name: 'Steel' }))
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'SF#RESOURCE', sk: 'RESOURCE#res-1' },
                }),
            })
        )
    })

    it('updates ingredients array', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })
        await handler(mockEvent('res-1', { ingredients: ['iron', 'coal'] }))
        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect((call as any).input.ExpressionAttributeValues[':ingredients']).toEqual(['iron', 'coal'])
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined, { name: 'Steel' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing resource id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when no updatable fields provided', async () => {
        const result = await handler(mockEvent('res-1', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No updatable fields provided')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('ignores non-allowed fields', async () => {
        const result = await handler(mockEvent('res-1', { hacked: true })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('res-1', { name: 'Steel' })) as any
        expect(result.statusCode).toBe(500)
    })
})
