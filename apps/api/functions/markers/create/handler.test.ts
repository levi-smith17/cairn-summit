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
            method: 'POST',
            path: '/markers',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /markers',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /markers',
    rawPath: '/markers',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('markers/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a marker and returns 201', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: [] }))

        const result = await handler(
            mockEvent('user-123', { name: 'Summit', color: '#FF0000' })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Summit')
        expect(data.color).toBe('#FF0000')
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^MARKER#/)
        expect(data.createdAt).toBeDefined()
    })

    it('creates a marker with optional icon', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Items: [] }))

        const result = await handler(
            mockEvent('user-123', { name: 'Camp', color: '#00FF00', icon: 'tent' })
        ) as any

        expect(result.statusCode).toBe(201)
        expect(JSON.parse(result.body).data.icon).toBe('tent')
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { color: '#FF0000' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name and color are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when color is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Summit' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name and color are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { name: 'Summit', color: '#FF0000' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})