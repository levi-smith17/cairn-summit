import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/starfield/systems', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /starfield/systems', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'POST /starfield/systems', rawPath: '/starfield/systems',
    rawQueryString: '', headers: {}, body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/system-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('creates a system and returns 201', async () => {
        const result = await handler(mockEvent({ name: 'Alpha Centauri' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Alpha Centauri')
        expect(data.pk).toBe('SF#SYSTEM')
        expect(data.sk).toBe('SYSTEM#alpha-centauri')
        expect(data.planets).toEqual([])
    })

    it('derives id from name using slug rules', async () => {
        const result = await handler(mockEvent({ name: "Sol's System!" })) as any
        expect(JSON.parse(result.body).data.sk).toBe('SYSTEM#sol-s-system-')
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent({})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name is required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent({ name: 'Sol' })) as any
        expect(result.statusCode).toBe(500)
    })
})
