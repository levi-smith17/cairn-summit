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
    body: Record<string, unknown>
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
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
            method: 'PUT',
            path: `/guides/stones/${id}/placement`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /guides/stones/{id}/placement',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /guides/stones/{id}/placement',
    rawPath: `/guides/stones/${id}/placement`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('stones/placement-update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates the stone placement and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'STONE#guide-1#abc' }] })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', 'abc', { placement: 'PLACED' })
        ) as any

        expect(result.statusCode).toBe(204)
    })

    it('returns 400 when placement is invalid', async () => {
        const result = await handler(
            mockEvent('user-123', 'abc', { placement: 'INVALID' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('placement must be one of: UNPLACED, PLACED, SET, SEATED')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 404 when stone is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(
            mockEvent('user-123', 'abc', { placement: 'SET' })
        ) as any

        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('Stone not found')
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(
            mockEvent('user-123', undefined, { placement: 'SET' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing stone id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'STONE#guide-1#abc' }] })
            .mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(
            mockEvent('user-123', 'abc', { placement: 'SEATED' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
