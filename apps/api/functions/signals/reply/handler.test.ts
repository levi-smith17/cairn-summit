import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string,
    id: string | undefined,
    body: object
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: `/signals/${id}/replies`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /signals/{id}/replies', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /signals/{id}/replies',
    rawPath: `/signals/${id}/replies`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('signals/reply handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { body: 'Hello' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing signal id')
    })

    it('returns 400 when body is missing', async () => {
        const result = await handler(mockEvent('user-123', 'sig-abc', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('body is required')
    })

    it('returns 201 with the created reply', async () => {
        const result = await handler(mockEvent('user-123', 'sig-abc', { body: '<p>Reply text</p>' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.body).toBe('<p>Reply text</p>')
        expect(data.direction).toBe('OUTBOUND')
        expect(data.id).toBeDefined()
        expect(data.createdAt).toBeDefined()
    })

    it('writes reply with correct sk pattern', async () => {
        await handler(mockEvent('user-123', 'sig-abc', { body: '<p>Hello</p>' }))

        const call = vi.mocked(dynamo.send).mock.calls[0]
        const item = call[0].input.Item
        expect(item.sk).toMatch(/^SIGNAL#sig-abc#REPLY#/)
        expect(item.pk).toBe('USER#user-123')
        expect(item.direction).toBe('OUTBOUND')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'sig-abc', { body: 'Hi' })) as any
        expect(result.statusCode).toBe(500)
    })
})
