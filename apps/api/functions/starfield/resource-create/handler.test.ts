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
        http: { method: 'POST', path: '/starfield/resources', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /starfield/resources', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'POST /starfield/resources', rawPath: '/starfield/resources',
    rawQueryString: '', headers: {}, body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/resource-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('creates a global resource and returns 201', async () => {
        const result = await handler(mockEvent({ name: 'Iron', abbreviation: 'Fe', type: 'mineral' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Iron')
        expect(data.abbreviation).toBe('Fe')
        expect(data.type).toBe('mineral')
        expect(data.pk).toBe('SF#RESOURCE')
        expect(data.sk).toMatch(/^RESOURCE#/)
    })

    it('defaults mined to false and ingredients to []', async () => {
        const result = await handler(mockEvent({ name: 'Iron', abbreviation: 'Fe', type: 'mineral' })) as any
        const data = JSON.parse(result.body).data
        expect(data.mined).toBe(false)
        expect(data.ingredients).toEqual([])
    })

    it('accepts optional mined, tier, and ingredients', async () => {
        const result = await handler(mockEvent({
            name: 'Steel', abbreviation: 'St', type: 'manufactured',
            mined: false, tier: 1, ingredients: ['iron'],
        })) as any
        const data = JSON.parse(result.body).data
        expect(data.tier).toBe(1)
        expect(data.mined).toBe(false)
        expect(data.ingredients).toEqual(['iron'])
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent({ abbreviation: 'Fe', type: 'mineral' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when abbreviation is missing', async () => {
        const result = await handler(mockEvent({ name: 'Iron', type: 'mineral' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when type is missing', async () => {
        const result = await handler(mockEvent({ name: 'Iron', abbreviation: 'Fe' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent({ name: 'Iron', abbreviation: 'Fe', type: 'mineral' })) as any
        expect(result.statusCode).toBe(500)
    })
})
