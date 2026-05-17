import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id: string | undefined): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/starfield/resources/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /starfield/resources/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'DELETE /starfield/resources/{id}', rawPath: `/starfield/resources/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined, isBase64Encoded: false,
})

describe('starfield/resource-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('deletes global resource and returns 204', async () => {
        const result = await handler(mockEvent('res-1')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'SF#RESOURCE', sk: 'RESOURCE#res-1' },
                }),
            })
        )
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing resource id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('res-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
