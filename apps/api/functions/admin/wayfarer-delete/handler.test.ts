import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/admin/wayfarers/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /admin/wayfarers/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /admin/wayfarers/{id}',
    rawPath: `/admin/wayfarers/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { id },
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true }

describe('admin/wayfarer-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456', 'target-1')) as any
        expect(result.statusCode).toBe(403)
    })

    it('deletes all user items and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            // QueryCommand — returns 2 items, no more pages
            .mockResolvedValueOnce({
                Items: [
                    { pk: 'USER#target-1', sk: 'PROFILE' },
                    { pk: 'USER#target-1', sk: 'MARKER#abc' },
                ],
            })
            .mockResolvedValueOnce({}) // DeleteCommand 1
            .mockResolvedValueOnce({}) // DeleteCommand 2

        const result = await handler(mockEvent('admin-123', 'target-1')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledTimes(4)
    })

    it('returns 204 when user has no items', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('admin-123', 'target-1')) as any
        expect(result.statusCode).toBe(204)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123', 'target-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
