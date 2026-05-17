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
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/headwaters/kin/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /headwaters/kin/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /headwaters/kin/{id}',
    rawPath: `/headwaters/kin/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('headwaters/kin-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined)) as any
        expect(result.statusCode).toBe(400)
    })

    it('deletes kin and returns 204', async () => {
        const result = await handler(mockEvent('user-123', 'abc')) as any
        expect(result.statusCode).toBe(204)
    })

    it('deletes with correct pk and sk', async () => {
        await handler(mockEvent('user-456', 'abc'))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'USER#user-456', sk: 'KIN#abc' },
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(mockEvent('user-123', 'abc')) as any
        expect(result.statusCode).toBe(500)
    })
})
