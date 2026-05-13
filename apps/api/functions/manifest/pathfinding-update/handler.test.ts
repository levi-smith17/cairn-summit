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
            path: `/manifest/pathfinding/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /manifest/pathfinding/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /manifest/pathfinding/{id}',
    rawPath: `/manifest/pathfinding/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('manifest/pathfinding update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates a pathfinding and returns 200', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { pk: 'USER#user-123', sk: 'PATHFINDING#abc', organization: 'Red Cross', role: 'volunteer' } })

        const result = await handler(mockEvent('user-123', 'abc', { organization: 'Red Cross' })) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.organization).toBe('Red Cross')
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { organization: 'Red Cross' })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing pathfinding id')
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

        const result = await handler(mockEvent('user-123', 'abc', { organization: 'Red Cross' })) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
