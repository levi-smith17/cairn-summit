import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub: 'user-123', email: 'test@cairn.local' },
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
            path: '/signals',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /signals',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /signals',
    rawPath: '/signals',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

describe('signals/get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns signals with nested replies', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Items: [
                {
                    sk: 'SIGNAL#s1',
                    senderName: 'Alice',
                    senderEmail: 'alice@example.com',
                    body: 'Hello',
                    read: false,
                    createdAt: '2024-01-02T00:00:00.000Z',
                },
                {
                    sk: 'SIGNAL#s1#REPLY#r1',
                    body: 'Hi Alice',
                    direction: 'OUTBOUND',
                    createdAt: '2024-01-02T01:00:00.000Z',
                },
            ],
        })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data).toHaveLength(1)
        expect(data[0].id).toBe('s1')
        expect(data[0].replies).toHaveLength(1)
        expect(data[0].token).toBeUndefined()
    })
})
