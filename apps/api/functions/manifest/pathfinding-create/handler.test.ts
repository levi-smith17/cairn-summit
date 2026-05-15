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
            method: 'POST',
            path: '/manifest/pathfinding',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /manifest/pathfinding',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /manifest/pathfinding',
    rawPath: '/manifest/pathfinding',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('manifest/pathfinding create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a pathfinding and returns 201', async () => {
        const result = await handler(mockEvent('user-123', { organization: 'Red Cross', startDate: '2020-01-01' })) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.organization).toBe('Red Cross')
    })

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent('user-123', {})) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('organization and startDate are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', { organization: 'Red Cross', startDate: '2020-01-01' })) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
