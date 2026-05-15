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
    id: string | undefined,
    body: Record<string, unknown>
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
            method: 'PUT',
            path: `/manifest/gear/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /manifest/gear/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /manifest/gear/{id}',
    rawPath: `/manifest/gear/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('manifest/gear update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates a gear and returns 200', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { pk: 'USER#user-123', sk: 'GEAR#abc', name: 'TypeScript', level: 'expert' } })

        const result = await handler(mockEvent('user-123', 'abc', { name: 'TypeScript' })) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.name).toBe('TypeScript')
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { name: 'TypeScript' })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing gear id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when no fields are supplied', async () => {
        const result = await handler(mockEvent('user-123', 'abc', {})) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No fields provided to update')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'abc', { name: 'TypeScript' })) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
