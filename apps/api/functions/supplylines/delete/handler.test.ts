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
    pathParams: Record<string, string>
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
            path: '/supplylines/supplyline-123',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'DELETE /supplylines/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /supplylines/{id}',
    rawPath: '/supplylines/supplyline-123',
    rawQueryString: '',
    headers: {},
    pathParameters: pathParams,
    isBase64Encoded: false,
})

describe('supplylines/delete handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('deletes a supplyline and returns 204', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' })
        ) as any

        expect(result.statusCode).toBe(204)
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(
            mockEvent('user-123', {})
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing supplyline id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})