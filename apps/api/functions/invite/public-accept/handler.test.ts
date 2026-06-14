import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/invites', () => ({
    acceptInvitation: vi.fn(),
}))

import { handler } from './handler'
import { acceptInvitation } from '../../shared/invites'

const mockEvent = (token = 'tok-1', body = { email: 'invite@cairn.local' }): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'POST /public/invite/{token}/accept',
    rawPath: `/public/invite/${token}/accept`,
    rawQueryString: '',
    headers: {},
    pathParameters: { token },
    body: JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: {
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'POST',
            path: `/public/invite/${token}/accept`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /public/invite/{token}/accept',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
})

describe('invite/public-accept handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('accepts a valid invitation', async () => {
        vi.mocked(acceptInvitation).mockResolvedValueOnce({ ok: true })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data.accepted).toBe(true)
    })

    it('returns 400 when email mismatches', async () => {
        vi.mocked(acceptInvitation).mockResolvedValueOnce({ ok: false, status: 400 })

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(400)
    })
})
