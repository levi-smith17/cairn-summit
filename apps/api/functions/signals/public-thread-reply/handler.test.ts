import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (token: string | undefined, body: object): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: `/public/thread/${token}/reply`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /public/thread/{token}/reply', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /public/thread/{token}/reply',
    rawPath: `/public/thread/${token}/reply`,
    rawQueryString: '',
    headers: {},
    pathParameters: token ? { token } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const validTokenItem = {
    pk: 'TOKEN',
    sk: 'test-token',
    userPk: 'USER#user-123',
    signalId: 'sig-abc',
    tokenExpiresAt: '2099-01-01T00:00:00.000Z',
}

const expiredTokenItem = {
    ...validTokenItem,
    tokenExpiresAt: '2020-01-01T00:00:00.000Z',
}

describe('signals/public-thread-reply handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when token is missing', async () => {
        const result = await handler(mockEvent(undefined, { body: 'Hi' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing token')
    })

    it('returns 400 when body is missing', async () => {
        const result = await handler(mockEvent('test-token', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('body is required')
    })

    it('returns 404 when token is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })

        const result = await handler(mockEvent('bad-token', { body: 'Hello' })) as any
        expect(result.statusCode).toBe(404)
    })

    it('returns 400 when token is expired', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: expiredTokenItem })

        const result = await handler(mockEvent('test-token', { body: 'Hi' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Reply link has expired')
    })

    it('returns 201 with the created inbound reply', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: validTokenItem }) // GetItem token
            .mockResolvedValueOnce({})                       // PutItem reply

        const result = await handler(mockEvent('test-token', { body: '<p>Hello</p>' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.direction).toBe('INBOUND')
        expect(data.body).toBe('<p>Hello</p>')
        expect(data.id).toBeDefined()
    })

    it('writes reply with INBOUND direction and correct sk', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: validTokenItem })
            .mockResolvedValueOnce({})

        await handler(mockEvent('test-token', { body: 'Hello' }))

        const putCall = vi.mocked(dynamo.send).mock.calls[1]
        const item = putCall[0].input.Item
        expect(item.sk).toMatch(/^SIGNAL#sig-abc#REPLY#/)
        expect(item.pk).toBe('USER#user-123')
        expect(item.direction).toBe('INBOUND')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('test-token', { body: 'Hi' })) as any
        expect(result.statusCode).toBe(500)
    })
})
