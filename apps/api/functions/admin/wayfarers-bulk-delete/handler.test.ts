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
        http: { method: 'DELETE', path: '/admin/wayfarers/bulk', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /admin/wayfarers/bulk', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /admin/wayfarers/bulk',
    rawPath: '/admin/wayfarers/bulk',
    rawQueryString: '',
    headers: {},
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true }

describe('admin/wayfarers-bulk-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456', { ids: ['a'] })) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 400 when ids is missing', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: adminProfile })

        const result = await handler(mockEvent('admin-123', {})) as any
        expect(result.statusCode).toBe(400)
    })

    it('deletes all items for each user and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            // QueryCommand for user id-1
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#id-1', sk: 'PROFILE' }] })
            .mockResolvedValueOnce({}) // DeleteCommand
            // QueryCommand for user id-2
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('admin-123', { ids: ['id-1', 'id-2'] })) as any
        expect(result.statusCode).toBe(204)
    })

    it('returns 204 for empty ids array', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: adminProfile })

        const result = await handler(mockEvent('admin-123', { ids: [] })) as any
        expect(result.statusCode).toBe(204)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123', { ids: ['a'] })) as any
        expect(result.statusCode).toBe(500)
    })
})
