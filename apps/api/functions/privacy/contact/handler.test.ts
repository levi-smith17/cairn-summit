import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('@aws-sdk/client-sesv2', () => ({
    SESv2Client: class { send = vi.fn().mockResolvedValue({}) },
    SendEmailCommand: vi.fn(),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (body?: Record<string, unknown>): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'POST',
            path: '/privacy',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /privacy',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /privacy',
    rawPath: '/privacy',
    rawQueryString: '',
    headers: {},
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
})

describe('privacy/contact handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent({ senderName: 'Test' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 429 when rate limited', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { pk: 'RATELIMIT#privacy#test@cairn.local' } })

        const result = await handler(mockEvent({
            senderName: 'Test User',
            senderEmail: 'test@cairn.local',
            requestType: 'Data Access',
            message: 'Please send my data.',
        })) as any

        expect(result.statusCode).toBe(429)
    })

    it('sends email and returns 201', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent({
            senderName: 'Test User',
            senderEmail: 'test@cairn.local',
            requestType: 'Data Access',
            message: 'Please send my data.',
        })) as any

        expect(result.statusCode).toBe(201)
        expect(dynamo.send).toHaveBeenCalledTimes(2)
    })
})
