import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
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

const validBody = { senderName: 'Alice', senderEmail: 'alice@example.com', body: 'Hello there!' }

const mockProfile = { pk: 'USER#user-123', sk: 'PROFILE', username: 'levi', email: 'levi@example.com' }

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
        expect(JSON.parse(result.body).error).toBe('senderName, senderEmail, and body are required')
    })

    it('returns 404 when user is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] }) // scan returns nothing

        const result = await handler(mockEvent('unknown', validBody)) as any
        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('User not found')
    })

    it('returns 201 with new signal id', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] }) // scan
            .mockResolvedValue({})                           // two PutCommands

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.id).toBeDefined()
    })

    it('stores a token lookup item alongside the signal', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValue({})

        await handler(mockEvent('levi', validBody))

        const puts = vi.mocked(dynamo.send).mock.calls.filter(c => c[0].input.Item)
        expect(puts).toHaveLength(2)
        const tokenPut = puts.find(c => c[0].input.Item.pk === 'TOKEN')
        expect(tokenPut).toBeDefined()
        expect(tokenPut![0].input.Item.userPk).toBe('USER#user-123')
    })

    it('creates signal with correct sender fields', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [mockProfile] })
            .mockResolvedValue({})

        await handler(mockEvent('levi', validBody))

        const signalPut = vi.mocked(dynamo.send).mock.calls.find(c =>
            c[0].input.Item?.sk?.startsWith('SIGNAL#')
        )
        expect(signalPut).toBeDefined()
        expect(signalPut![0].input.Item.senderName).toBe('Alice')
        expect(signalPut![0].input.Item.senderEmail).toBe('alice@example.com')
        expect(signalPut![0].input.Item.read).toBe(false)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('levi', validBody)) as any
        expect(result.statusCode).toBe(500)
    })
})
