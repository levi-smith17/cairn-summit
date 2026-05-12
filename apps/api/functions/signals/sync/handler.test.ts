import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/signals/sync', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /signals/sync', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /signals/sync',
    rawPath: '/signals/sync',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('signals/sync handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when since is missing', async () => {
        const result = await handler(mockEvent('user-123', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('since is required')
    })

    it('returns 400 when since is not a valid timestamp', async () => {
        const result = await handler(mockEvent('user-123', { since: 'not-a-date' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('since must be a valid ISO timestamp')
    })

    it('returns unreadCount and empty signals when none are new', async () => {
        const signals = [
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-1', read: false, createdAt: '2026-01-01T00:00:00.000Z', senderName: 'Alice', body: 'Hi' },
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-2', read: true, createdAt: '2026-01-01T00:00:00.000Z', senderName: 'Bob', body: 'Hey' },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: signals })

        const result = await handler(mockEvent('user-123', { since: '2026-01-02T00:00:00.000Z' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.unreadCount).toBe(1)
        expect(data.signals).toHaveLength(0)
    })

    it('returns new signals since the given timestamp', async () => {
        const signals = [
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-1', read: false, createdAt: '2026-01-01T00:00:00.000Z', senderName: 'Alice', body: 'Old' },
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-2', read: false, createdAt: '2026-01-03T00:00:00.000Z', senderName: 'Bob', body: 'New' },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: signals })

        const result = await handler(mockEvent('user-123', { since: '2026-01-02T00:00:00.000Z' })) as any
        const data = JSON.parse(result.body).data
        expect(data.unreadCount).toBe(2)
        expect(data.signals).toHaveLength(1)
        expect(data.signals[0].id).toBe('sig-2')
    })

    it('excludes replies from the query using FilterExpression', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        await handler(mockEvent('user-123', { since: '2026-01-01T00:00:00.000Z' }))

        const call = vi.mocked(dynamo.send).mock.calls[0]
        expect(call[0].input.FilterExpression).toContain('NOT contains')
        expect(call[0].input.ExpressionAttributeValues[':replyMarker']).toBe('#REPLY#')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', { since: '2026-01-01T00:00:00.000Z' })) as any
        expect(result.statusCode).toBe(500)
    })
})
