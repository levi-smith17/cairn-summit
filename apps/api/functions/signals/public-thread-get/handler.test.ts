import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (token: string | undefined): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: `/public/thread/${token}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /public/thread/{token}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /public/thread/{token}',
    rawPath: `/public/thread/${token}`,
    rawQueryString: '',
    headers: {},
    pathParameters: token ? { token } : undefined,
    isBase64Encoded: false,
})

const mockTokenItem = {
    pk: 'TOKEN',
    sk: 'test-token',
    userPk: 'USER#user-123',
    signalId: 'sig-abc',
    tokenExpiresAt: '2099-01-01T00:00:00.000Z',
}

const mockSignal = {
    pk: 'USER#user-123',
    sk: 'SIGNAL#sig-abc',
    senderName: 'Alice',
    senderEmail: 'alice@example.com',
    body: 'Hello',
    read: false,
    createdAt: '2026-01-01T00:00:00.000Z',
}

const mockProfile = { pk: 'USER#user-123', sk: 'PROFILE', username: 'levi', email: 'levi@example.com' }

describe('signals/public-thread-get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when token is missing', async () => {
        const result = await handler(mockEvent(undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing token')
    })

    it('returns 404 when token is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })

        const result = await handler(mockEvent('bad-token')) as any
        expect(result.statusCode).toBe(404)
    })

    it('returns 404 when signal is not found', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockTokenItem })  // token lookup
            .mockResolvedValueOnce({ Items: [] })             // signal query — empty

        const result = await handler(mockEvent('test-token')) as any
        expect(result.statusCode).toBe(404)
    })

    it('returns thread with signal + replies + wayfarer', async () => {
        const reply = {
            pk: 'USER#user-123',
            sk: 'SIGNAL#sig-abc#REPLY#reply-1',
            body: 'Hi back',
            direction: 'OUTBOUND',
            createdAt: '2026-01-02T00:00:00.000Z',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockTokenItem })           // token GetItem
            .mockResolvedValueOnce({ Items: [mockSignal, reply] })    // signal+replies query
            .mockResolvedValueOnce({ Item: mockProfile })             // profile GetItem

        const result = await handler(mockEvent('test-token')) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.id).toBe('sig-abc')
        expect(data.senderName).toBe('Alice')
        expect(data.replies).toHaveLength(1)
        expect(data.wayfarer.username).toBe('levi')
        expect(data.tokenExpiresAt).toBe(mockTokenItem.tokenExpiresAt)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('test-token')) as any
        expect(result.statusCode).toBe(500)
    })
})
