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
    id: string | undefined
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
                scopes: [],
            },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'DELETE',
            path: `/manifest/gear/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'DELETE /manifest/gear/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /manifest/gear/{id}',
    rawPath: `/manifest/gear/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('manifest/gear delete handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('deletes a gear and returns 204', async () => {
        const result = await handler(mockEvent('user-123', 'abc')) as any

        expect(result.statusCode).toBe(204)
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined)) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing gear id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'abc')) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
