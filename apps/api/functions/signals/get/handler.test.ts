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
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/signals', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /signals', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /signals',
    rawPath: '/signals',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

const makeSignal = (id: string, read = false) => ({
    pk: 'USER#user-123',
    sk: `SIGNAL#${id}`,
    senderName: 'Alice',
    senderEmail: 'alice@example.com',
    body: 'Hello',
    read,
    token: 'secret-token',
    createdAt: '2026-01-01T00:00:00.000Z',
})

const makeReply = (signalId: string, replyId: string, direction = 'OUTBOUND') => ({
    pk: 'USER#user-123',
    sk: `SIGNAL#${signalId}#REPLY#${replyId}`,
    body: 'Reply body',
    direction,
    createdAt: '2026-01-02T00:00:00.000Z',
})

describe('signals/get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns empty array when user has no signals', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('returns signals with nested replies', async () => {
        const signal = makeSignal('sig-1')
        const reply = makeReply('sig-1', 'reply-1', 'OUTBOUND')
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [signal, reply] })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(1)
        expect(data[0].replies).toHaveLength(1)
        expect(data[0].replies[0].id).toBe('reply-1')
        expect(data[0].replies[0].direction).toBe('OUTBOUND')
    })

    it('strips the token field from returned signals', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [makeSignal('sig-1')] })

        const result = await handler(mockEvent('user-123')) as any
        const data = JSON.parse(result.body).data
        expect(data[0].token).toBeUndefined()
    })

    it('returns signals sorted newest-first', async () => {
        const older = { ...makeSignal('sig-1'), createdAt: '2026-01-01T00:00:00.000Z' }
        const newer = { ...makeSignal('sig-2'), createdAt: '2026-01-03T00:00:00.000Z' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [older, newer] })

        const result = await handler(mockEvent('user-123')) as any
        const data = JSON.parse(result.body).data
        expect(data[0].id).toBe('sig-2')
        expect(data[1].id).toBe('sig-1')
    })

    it('queries with correct pk and sk prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        await handler(mockEvent('user-456'))

        expect(vi.mocked(dynamo.send).mock.calls[0][0].input.ExpressionAttributeValues).toMatchObject({
            ':pk': 'USER#user-456',
            ':prefix': 'SIGNAL#',
        })
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(500)
    })
})
