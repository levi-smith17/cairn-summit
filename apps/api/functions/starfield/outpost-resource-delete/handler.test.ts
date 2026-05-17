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
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/starfield/outposts/${outpostId}/resources/${resourceId}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /starfield/outposts/{outpostId}/resources/{resourceId}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'DELETE /starfield/outposts/{outpostId}/resources/{resourceId}',
    rawPath: `/starfield/outposts/${outpostId}/resources/${resourceId}`,
    rawQueryString: '', headers: {},
    pathParameters: outpostId && resourceId ? { outpostId, resourceId } : undefined,
    isBase64Encoded: false,
})

describe('starfield/outpost-resource-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('removes resource from outpost and returns 204', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', 'res-1')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'USER#user-1', sk: 'SF#FACILITY#outpost-1' },
                    UpdateExpression: 'REMOVE #resources.#rid',
                    ExpressionAttributeNames: { '#resources': 'resources', '#rid': 'res-1' },
                }),
            })
        )
    })

    it('returns 400 when outpostId is missing', async () => {
        const result = await handler(mockEvent('user-1', undefined, 'res-1')) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing outpostId or resourceId')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when resourceId is missing', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', 'outpost-1', 'res-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
