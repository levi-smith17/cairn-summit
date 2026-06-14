import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('../../shared/signals', () => ({
    createContactSignal: vi.fn(),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'
import { createContactSignal } from '../../shared/signals'

const mockEvent = (username: string | undefined, body: object): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: `/public/manifest/${username}/contact`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /public/manifest/{username}/contact', stage: '$default', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /public/manifest/{username}/contact',
    rawPath: `/public/manifest/${username}/contact`,
    rawQueryString: '',
    headers: {},
    pathParameters: username ? { username } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const validBody = { senderName: 'Alice', senderEmail: 'alice@example.com', body: 'Hello there!' }

describe('manifest/public-contact handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when username is missing', async () => {
        const result = await handler(mockEvent(undefined, validBody)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing username')
    })

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent('levi', { senderName: 'Alice' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('senderName, senderEmail, and body are required')
    })

    it('returns 429 when sender is rate limited', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Item: { pk: 'RATELIMIT#alice@example.com', sk: 'CHECK', ttl: 9999999999 },
        })

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(429)
    })

    it('returns 404 when user is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({})
        vi.mocked(createContactSignal).mockResolvedValueOnce(null)

        const result = await handler(mockEvent('unknown', validBody)) as any
        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('User not found')
    })

    it('returns 201 with signal id and thread url', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})
        vi.mocked(createContactSignal).mockResolvedValueOnce({
            id: 'sig-1',
            token: 'tok',
            threadUrl: 'https://dev.cairn.ing/thread/tok',
        })

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(201)
        expect(JSON.parse(result.body).data).toEqual({
            id: 'sig-1',
            threadUrl: 'https://dev.cairn.ing/thread/tok',
        })
    })

    it('writes a rate-limit record keyed by sender email', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})
        vi.mocked(createContactSignal).mockResolvedValueOnce({
            id: 'sig-1',
            token: 'tok',
            threadUrl: 'https://dev.cairn.ing/thread/tok',
        })

        await handler(mockEvent('levi', validBody))

        const puts = vi.mocked(dynamo.send).mock.calls.filter(c => c[0].input.Item)
        expect(puts).toHaveLength(1)
        expect(puts[0][0].input.Item.pk).toBe('RATELIMIT#alice@example.com')
        expect(puts[0][0].input.Item.sk).toBe('CHECK')
        expect(puts[0][0].input.Item.ttl).toBeDefined()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(500)
    })
})
