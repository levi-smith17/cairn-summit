import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string, body?: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/admin/wayfarers/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /admin/wayfarers/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /admin/wayfarers/{id}',
    rawPath: `/admin/wayfarers/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { id },
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true, name: 'Admin', email: 'admin@cairn.local' }

describe('admin/wayfarer-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456', 'target-1', { email: 'a@b.com' })) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 400 when email is missing', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: adminProfile })

        const result = await handler(mockEvent('admin-123', 'target-1', {})) as any
        expect(result.statusCode).toBe(400)
    })

    it('updates the wayfarer and returns 200', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({}) // UpdateCommand
            .mockResolvedValueOnce({}) // PutCommand activity

        const result = await handler(mockEvent('admin-123', 'target-1', { email: 'updated@cairn.local', isAdmin: false, listed: true })) as any
        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body)
        expect(body.data.id).toBe('target-1')
    })

    it('still returns 200 when activity log fails', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('log failed'))

        const result = await handler(mockEvent('admin-123', 'target-1', { email: 'a@b.com' })) as any
        expect(result.statusCode).toBe(200)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123', 'target-1', { email: 'a@b.com' })) as any
        expect(result.statusCode).toBe(500)
    })
})
