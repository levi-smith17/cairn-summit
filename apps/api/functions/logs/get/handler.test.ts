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
            path: '/logs',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /logs',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /logs',
    rawPath: '/logs',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

describe('logs/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when user has no logs', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('returns logs for the user', async () => {
        const logs = [
            {
                pk: 'USER#user-123',
                sk: 'LOG#log-1',
                content: 'My first entry',
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                pk: 'USER#user-123',
                sk: 'LOG#log-2',
                title: 'Meeting Notes',
                content: 'Discussed project scope',
                markers: [],
                createdAt: '2026-01-02T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: logs })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toHaveLength(2)
    })

    it('queries with correct pk and sk prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        await handler(mockEvent('user-456'))

        const calls = vi.mocked(dynamo.send).mock.calls
        expect(calls[0][0].input.ExpressionAttributeValues).toMatchObject({
            ':pk': 'USER#user-456',
            ':prefix': 'LOG#',
        })
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
