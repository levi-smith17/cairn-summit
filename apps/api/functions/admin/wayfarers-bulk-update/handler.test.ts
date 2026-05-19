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
        http: { method: 'PUT', path: '/admin/wayfarers/bulk', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /admin/wayfarers/bulk', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /admin/wayfarers/bulk',
    rawPath: '/admin/wayfarers/bulk',
    rawQueryString: '',
    headers: {},
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true }

describe('admin/wayfarers-bulk-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456', { ids: ['a'], listed: true })) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 400 when ids is missing', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: adminProfile })

        const result = await handler(mockEvent('admin-123', { listed: true })) as any
        expect(result.statusCode).toBe(400)
    })

    it('updates listed for all ids and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValue({}) // UpdateCommands

        const result = await handler(mockEvent('admin-123', { ids: ['id-1', 'id-2'], listed: true })) as any
        expect(result.statusCode).toBe(204)
        // admin check + 2 updates = 3 calls
        expect(dynamo.send).toHaveBeenCalledTimes(3)
    })

    it('returns 204 for empty ids array', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: adminProfile })

        const result = await handler(mockEvent('admin-123', { ids: [], listed: false })) as any
        expect(result.statusCode).toBe(204)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123', { ids: ['a'], listed: true })) as any
        expect(result.statusCode).toBe(500)
    })
})
