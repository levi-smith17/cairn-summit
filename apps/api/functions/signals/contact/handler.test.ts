import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('@aws-sdk/client-sesv2', () => ({
    SESv2Client: class { send = vi.fn().mockResolvedValue({}) },
    SendEmailCommand: vi.fn(),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (username: string | undefined, body: object): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: `/signals/contact/${username}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: `POST /signals/contact/{username}`, stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /signals/contact/{username}',
    rawPath: `/signals/contact/${username}`,
    rawQueryString: '',
    headers: {},
    pathParameters: username ? { username } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const validBody = { senderName: 'Alice', senderEmail: 'alice@example.com', message: 'Hello there!' }
const mockProfile = { pk: 'USER#user-123', sk: 'PROFILE', username: 'levi', email: 'levi@example.com' }

// DynamoDB call order for happy path:
// 1. GetItem — rate limit check (returns {} = no existing record)
// 2. ScanCommand — profile lookup
// 3. PutItem — write rate-limit record

describe('signals/contact handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when username is missing', async () => {
        const result = await handler(mockEvent(undefined, validBody)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing username')
    })

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent('levi', { senderName: 'Alice' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('senderName, senderEmail, and message are required')
    })

    it('returns 429 when sender is rate limited', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Item: { pk: 'RATELIMIT#alice@example.com', sk: 'CHECK', ttl: 9999999999 },
        })

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(429)
    })

    it('returns 404 when user is not found', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({})               // GetItem — no rate limit
            .mockResolvedValueOnce({ Items: [] })    // Scan — no profile

        const result = await handler(mockEvent('unknown', validBody)) as any
        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('User not found')
    })

    it('returns 201 with success on valid contact', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({})                            // GetItem — no rate limit
            .mockResolvedValueOnce({ Items: [mockProfile] })     // Scan — found profile
            .mockResolvedValue({})                                // PutItem

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(201)
        expect(JSON.parse(result.body).data).toEqual({ success: true })
    })

    it('writes a rate-limit record keyed by sender email', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValue({})

        await handler(mockEvent('levi', validBody))

        const puts = vi.mocked(dynamo.send).mock.calls.filter(c => c[0].input.Item)
        expect(puts).toHaveLength(1)
        const rateLimitPut = puts[0]
        expect(rateLimitPut[0].input.Item.pk).toBe('RATELIMIT#alice@example.com')
        expect(rateLimitPut[0].input.Item.sk).toBe('CHECK')
        expect(rateLimitPut[0].input.Item.ttl).toBeDefined()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(500)
    })
})
