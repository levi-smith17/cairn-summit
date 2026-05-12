import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
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
            method: 'GET',
            path: '/waypoints',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /waypoints',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /waypoints',
    rawPath: '/waypoints',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

describe('waypoints/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when user has no waypoints', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('returns waypoints for the user', async () => {
        const waypoints = [
            {
                pk: 'USER#user-123',
                sk: 'WAYPOINT#wp-1',
                url: 'https://example.com',
                title: 'Example',
                read: false,
                readLater: false,
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: waypoints })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toHaveLength(1)
    })

    it('queries with correct pk and sk prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        await handler(mockEvent('user-456'))

        const calls = vi.mocked(dynamo.send).mock.calls
        expect(calls[0][0].input.ExpressionAttributeValues).toMatchObject({
            ':pk': 'USER#user-456',
            ':prefix': 'WAYPOINT#',
        })
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
