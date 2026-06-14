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
        http: { method: 'DELETE', path: `/admin/invitations/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /admin/invitations/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /admin/invitations/{id}',
    rawPath: `/admin/invitations/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { id },
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true }

describe('admin/invitation-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456', 'inv-1')) as any
        expect(result.statusCode).toBe(403)
    })

    it('deletes the invitation and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({ Item: { token: 'tok-1' } })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('admin-123', 'inv-1')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledTimes(4)
    })

    it('deletes using correct pk and sk', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({ Item: { token: 'tok-abc' } })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})

        await handler(mockEvent('admin-123', 'inv-abc'))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'ADMIN', sk: 'INVITATION#inv-abc' },
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123', 'inv-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
