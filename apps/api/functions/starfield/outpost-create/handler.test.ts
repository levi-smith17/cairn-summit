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
        http: { method: 'POST', path: '/starfield/outposts', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /starfield/outposts', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'POST /starfield/outposts', rawPath: '/starfield/outposts',
    rawQueryString: '', headers: {}, body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/outpost-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('creates an outpost and returns 201', async () => {
        const result = await handler(mockEvent('user-1', { networkId: 'net-1', system: 'Alpha Centauri', planet: 'Montara' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.networkId).toBe('net-1')
        expect(data.system).toBe('Alpha Centauri')
        expect(data.planet).toBe('Montara')
        expect(data.sk).toMatch(/^SF#FACILITY#/)
        expect(data.depth).toBe(0)
        expect(data.resources).toEqual([])
    })

    it('sets depth to 1 when parentId is provided', async () => {
        const result = await handler(mockEvent('user-1', { networkId: 'net-1', system: 'Alpha Centauri', planet: 'Montara', parentId: 'parent-1' })) as any
        expect(result.statusCode).toBe(201)
        expect(JSON.parse(result.body).data.depth).toBe(1)
    })

    it('uses default transferStationLimit of 32', async () => {
        const result = await handler(mockEvent('user-1', { networkId: 'net-1', system: 'Alpha Centauri', planet: 'Montara' })) as any
        expect(JSON.parse(result.body).data.transferStationLimit).toBe(32)
    })

    it('returns 400 when networkId is missing', async () => {
        const result = await handler(mockEvent('user-1', { system: 'Alpha Centauri', planet: 'Montara' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when system is missing', async () => {
        const result = await handler(mockEvent('user-1', { networkId: 'net-1', planet: 'Montara' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when planet is missing', async () => {
        const result = await handler(mockEvent('user-1', { networkId: 'net-1', system: 'Alpha Centauri' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', { networkId: 'net-1', system: 'Alpha Centauri', planet: 'Montara' })) as any
        expect(result.statusCode).toBe(500)
    })
})
