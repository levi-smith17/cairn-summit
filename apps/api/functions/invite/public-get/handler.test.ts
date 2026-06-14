import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/invites', () => ({
    getPublicInvite: vi.fn(),
}))

import { handler } from './handler'
import { getPublicInvite } from '../../shared/invites'

const mockEvent = (token = 'tok-1'): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'GET /public/invite/{token}',
    rawPath: `/public/invite/${token}`,
    rawQueryString: '',
    headers: {},
    pathParameters: { token },
    isBase64Encoded: false,
    requestContext: {
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'GET',
            path: `/public/invite/${token}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /public/invite/{token}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
})

describe('invite/public-get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns invite details', async () => {
        vi.mocked(getPublicInvite).mockResolvedValueOnce({
            email: 'invite@cairn.local',
            note: 'Welcome',
            expiresAt: '2026-12-31T00:00:00.000Z',
            usedAt: null,
            invitedBy: { name: 'Admin', email: 'admin@cairn.local' },
        })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data.email).toBe('invite@cairn.local')
    })

    it('returns 404 when invite is missing', async () => {
        vi.mocked(getPublicInvite).mockResolvedValueOnce(null)

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(404)
    })
})
