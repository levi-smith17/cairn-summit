import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string,
    outpostId: string | undefined,
    resourceId: string | undefined,
    body: Record<string, unknown>,
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/starfield/outposts/${outpostId}/resources/${resourceId}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/outposts/{outpostId}/resources/{resourceId}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/outposts/{outpostId}/resources/{resourceId}',
    rawPath: `/starfield/outposts/${outpostId}/resources/${resourceId}`,
    rawQueryString: '', headers: {},
    pathParameters: outpostId && resourceId ? { outpostId, resourceId } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/outpost-resource-upsert handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('upserts resource on outpost and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [{ name: 'Iron', abbreviation: 'Fe' }] } })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('user-1', 'outpost-1', 'res-1', { onsite: true })) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledTimes(2)
    })

    it('passes resource name and abbreviation from global resource to the update', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [{ name: 'Iron', abbreviation: 'Fe' }] } })
            .mockResolvedValueOnce({})

        await handler(mockEvent('user-1', 'outpost-1', 'res-1', { onsite: false }))

        const updateCall = vi.mocked(dynamo.send).mock.calls[1][0]
        expect((updateCall as any).input.ExpressionAttributeValues[':value']).toMatchObject({
            resourceId: 'res-1',
            name: 'Iron',
            abbreviation: 'Fe',
            onsite: false,
            supplies: [],
        })
    })

    it('returns 404 when global resource not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Responses: { 'cairn-test': [] } })
        const result = await handler(mockEvent('user-1', 'outpost-1', 'res-1', { onsite: true })) as any
        expect(result.statusCode).toBe(404)
        expect(dynamo.send).toHaveBeenCalledTimes(1)
    })

    it('returns 400 when outpostId is missing', async () => {
        const result = await handler(mockEvent('user-1', undefined, 'res-1', { onsite: true })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing outpostId or resourceId')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when resourceId is missing', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', undefined, { onsite: true })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when onsite is not a boolean', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', 'res-1', { onsite: 'yes' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('onsite is required and must be a boolean')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', 'outpost-1', 'res-1', { onsite: true })) as any
        expect(result.statusCode).toBe(500)
    })
})
