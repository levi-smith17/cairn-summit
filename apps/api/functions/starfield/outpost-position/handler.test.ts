import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string | undefined, body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/starfield/outposts/${id}/position`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/outposts/{id}/position', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/outposts/{id}/position', rawPath: `/starfield/outposts/${id}/position`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/outpost-position handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('updates position and returns 204', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', { x: 100, y: 200 })) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    ExpressionAttributeValues: { ':pos': { x: 100, y: 200 } },
                }),
            })
        )
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-1', undefined, { x: 0, y: 0 })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing outpost id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when x is missing', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', { y: 0 })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('x and y must be numbers')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when y is a string', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', { x: 0, y: 'bad' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', 'outpost-1', { x: 0, y: 0 })) as any
        expect(result.statusCode).toBe(500)
    })
})
