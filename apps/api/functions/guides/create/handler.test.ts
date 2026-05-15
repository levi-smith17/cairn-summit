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
            path: '/guides',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /guides',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /guides',
    rawPath: '/guides',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('guides/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a guide and returns 201', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Hiking Guide' })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Hiking Guide')
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^GUIDE#/) 
        expect(data.id).toBeDefined()
        expect(data.createdAt).toBeDefined()
    })

    it('creates a guide with optional description and trailId', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Camping Guide', description: 'A good guide', trailId: 'trail-1' })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.description).toBe('A good guide')
        expect(data.trailId).toBe('trail-1')
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { description: 'No name' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name is required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(
            mockEvent('user-123', { name: 'Hiking Guide' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
