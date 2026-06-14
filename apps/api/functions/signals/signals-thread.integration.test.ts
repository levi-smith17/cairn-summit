import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../shared/db', async () => {
    const { getSharedMemoryDynamo } = await import('../shared/test/memory-dynamo')
    return {
        dynamo: getSharedMemoryDynamo(),
        TABLE_NAME: 'cairn-test',
    }
})

vi.mock('@aws-sdk/client-sesv2', () => {
    class MockSESv2Client {
        send = vi.fn()
    }
    return {
        SESv2Client: MockSESv2Client,
        SendEmailCommand: vi.fn(),
    }
})

import { getSharedMemoryDynamo } from '../shared/test/memory-dynamo'
import { handler as contactHandler } from '../manifest/public-contact/handler'
import { handler as threadGetHandler } from './public-thread-get/handler'
import { handler as visitorReplyHandler } from './public-thread-reply/handler'
import { handler as wayfarerReplyHandler } from './reply/handler'

const memory = getSharedMemoryDynamo()

const USER_PK = 'USER#user-123'

const contactEvent = (body: object): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'POST',
            path: '/public/manifest/levi/contact',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /public/manifest/{username}/contact',
        stage: '$default',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /public/manifest/{username}/contact',
    rawPath: '/public/manifest/levi/contact',
    rawQueryString: '',
    headers: {},
    pathParameters: { username: 'levi' },
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const threadEvent = (token: string): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'GET',
            path: `/public/thread/${token}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /public/thread/{token}',
        stage: '$default',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /public/thread/{token}',
    rawPath: `/public/thread/${token}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { token },
    isBase64Encoded: false,
})

const visitorReplyEvent = (token: string, body: string): APIGatewayProxyEventV2 => ({
    ...threadEvent(token),
    requestContext: {
        ...threadEvent(token).requestContext,
        http: {
            ...threadEvent(token).requestContext.http,
            method: 'POST',
            path: `/public/thread/${token}/reply`,
        },
        routeKey: 'POST /public/thread/{token}/reply',
    },
    routeKey: 'POST /public/thread/{token}/reply',
    rawPath: `/public/thread/${token}/reply`,
    body: JSON.stringify({ body }),
})

const wayfarerReplyEvent = (signalId: string, body: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub: 'user-123', email: 'levi@cairn.local' },
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
            method: 'POST',
            path: `/signals/${signalId}/reply`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /signals/{id}/reply',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /signals/{id}/reply',
    rawPath: `/signals/${signalId}/reply`,
    rawQueryString: '',
    headers: {},
    pathParameters: { id: signalId },
    body: JSON.stringify({ body }),
    isBase64Encoded: false,
})

describe('signals contact thread flow (integration)', () => {
    beforeEach(() => {
        memory.reset()
        process.env.WEB_URL = 'https://dev.cairn.ing'
        delete process.env.SES_FROM_EMAIL
        memory.seed([
            {
                pk: USER_PK,
                sk: 'PROFILE',
                username: 'levi',
                name: 'Levi',
                email: 'levi@cairn.local',
            },
        ])
    })

    it('contact → public thread → visitor reply → wayfarer reply', async () => {
        const contactResult = await contactHandler(contactEvent({
            senderName: 'Alice',
            senderEmail: 'alice@example.com',
            body: 'Hello from the trail',
        })) as { statusCode: number; body: string }

        expect(contactResult.statusCode).toBe(201)
        const { id: signalId, threadUrl } = JSON.parse(contactResult.body).data
        expect(signalId).toBeTruthy()
        expect(threadUrl).toMatch(/\/thread\//)

        const token = threadUrl.split('/thread/')[1]

        const threadBefore = await threadGetHandler(threadEvent(token)) as { statusCode: number; body: string }
        expect(threadBefore.statusCode).toBe(200)
        const threadBody = JSON.parse(threadBefore.body).data
        expect(threadBody.id).toBe(signalId)
        expect(threadBody.senderName).toBe('Alice')
        expect(threadBody.body).toBe('Hello from the trail')
        expect(threadBody.replies).toHaveLength(0)

        const visitorResult = await visitorReplyHandler(
            visitorReplyEvent(token, 'Thanks for reaching out!'),
        ) as { statusCode: number; body: string }
        expect(visitorResult.statusCode).toBe(201)
        expect(JSON.parse(visitorResult.body).data.direction).toBe('INBOUND')

        const wayfarerResult = await wayfarerReplyHandler(
            wayfarerReplyEvent(signalId, 'Happy to connect.'),
        ) as { statusCode: number; body: string }
        expect(wayfarerResult.statusCode).toBe(201)
        expect(JSON.parse(wayfarerResult.body).data.direction).toBe('OUTBOUND')

        const threadAfter = await threadGetHandler(threadEvent(token)) as { statusCode: number; body: string }
        const replies = JSON.parse(threadAfter.body).data.replies
        expect(replies).toHaveLength(2)
        expect(replies[0].direction).toBe('INBOUND')
        expect(replies[1].direction).toBe('OUTBOUND')
    })
})
