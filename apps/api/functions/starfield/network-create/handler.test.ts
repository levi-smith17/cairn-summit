import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/starfield/networks', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /starfield/networks', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'POST /starfield/networks', rawPath: '/starfield/networks',
    rawQueryString: '', headers: {}, body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/network-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('creates a network and returns 201', async () => {
        const result = await handler(mockEvent('user-1', { name: 'Alpha Network', abbreviation: 'AN' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Alpha Network')
        expect(data.abbreviation).toBe('AN')
        expect(data.pk).toBe('USER#user-1')
        expect(data.sk).toMatch(/^SF#NETWORK#/)
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent('user-1', { abbreviation: 'AN' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name and abbreviation are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when abbreviation is missing', async () => {
        const result = await handler(mockEvent('user-1', { name: 'Alpha Network' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name and abbreviation are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', { name: 'Alpha Network', abbreviation: 'AN' })) as any
        expect(result.statusCode).toBe(500)
    })
})
