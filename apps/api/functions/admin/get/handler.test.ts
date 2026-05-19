import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/admin', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /admin', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /admin',
    rawPath: '/admin',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

const adminProfile = { pk: 'USER#admin-123', sk: 'PROFILE', isAdmin: true, name: 'Admin', email: 'admin@cairn.local' }

describe('admin/get handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 403 when user is not admin', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { isAdmin: false } })

        const result = await handler(mockEvent('user-456')) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 403 when profile does not exist', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })

        const result = await handler(mockEvent('user-456')) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns wayfarers, invitations, and activities for admin', async () => {
        vi.mocked(dynamo.send)
            // GetCommand — admin profile check
            .mockResolvedValueOnce({ Item: adminProfile })
            // ScanCommand — all profiles
            .mockResolvedValueOnce({ Items: [adminProfile] })
            // QueryCommand — invitations
            .mockResolvedValueOnce({ Items: [] })
            // QueryCommand — activities
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('admin-123')) as any
        expect(result.statusCode).toBe(200)
        const body = JSON.parse(result.body)
        expect(body.data.wayfarers).toHaveLength(1)
        expect(body.data.wayfarers[0].id).toBe('admin-123')
        expect(body.data.invitations).toEqual([])
        expect(body.data.activities).toEqual([])
    })

    it('maps invitation fields correctly', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: adminProfile })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({
                Items: [{
                    sk: 'INVITATION#inv-1',
                    email: 'invitee@cairn.local',
                    note: 'Welcome!',
                    invitedByName: 'Admin',
                    invitedByEmail: 'admin@cairn.local',
                    expiresAt: '2026-06-01T00:00:00.000Z',
                    usedAt: null,
                    createdAt: '2026-05-01T00:00:00.000Z',
                    token: 'tok-abc',
                }],
            })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('admin-123')) as any
        const body = JSON.parse(result.body)
        expect(body.data.invitations[0]).toMatchObject({
            id: 'inv-1',
            email: 'invitee@cairn.local',
            invitedBy: { name: 'Admin', email: 'admin@cairn.local' },
        })
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('admin-123')) as any
        expect(result.statusCode).toBe(500)
    })
})
