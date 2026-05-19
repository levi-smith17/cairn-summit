import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, body?: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/admin/wayfarers', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /admin/wayfarers', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /admin/wayfarers',
    rawPath: '/admin/wayfarers',
    rawQueryString: '',
    headers: {},
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true, name: 'Admin', email: 'admin@cairn.local' }

describe('admin/wayfarer-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456', { email: 'new@cairn.local' })) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 400 when email is missing', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: adminProfile })

        const result = await handler(mockEvent('admin-123', {})) as any
        expect(result.statusCode).toBe(400)
    })

    it('creates a wayfarer and returns 201 with id', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({}) // PutCommand profile
            .mockResolvedValueOnce({}) // PutCommand activity

        const result = await handler(mockEvent('admin-123', { email: 'new@cairn.local', listed: true })) as any
        expect(result.statusCode).toBe(201)
        const body = JSON.parse(result.body)
        expect(body.data.id).toBeDefined()
        expect(typeof body.data.id).toBe('string')
    })

    it('still returns 201 when activity log fails', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('log failed'))

        const result = await handler(mockEvent('admin-123', { email: 'new@cairn.local' })) as any
        expect(result.statusCode).toBe(201)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123', { email: 'new@cairn.local' })) as any
        expect(result.statusCode).toBe(500)
    })
})
