import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/starfield/systems', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /starfield/systems', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'GET /starfield/systems', rawPath: '/starfield/systems',
    rawQueryString: '', headers: {}, isBase64Encoded: false,
})

describe('starfield/systems-get handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns all global systems', async () => {
        const systems = [
            { pk: 'SF#SYSTEM', sk: 'SYSTEM#sol', name: 'Sol', planets: [] },
            { pk: 'SF#SYSTEM', sk: 'SYSTEM#alpha-centauri', name: 'Alpha Centauri', planets: [] },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: systems })

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(systems)
    })

    it('returns empty array when no systems exist', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('queries with SF#SYSTEM pk and SYSTEM# prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        await handler(mockEvent())
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    ExpressionAttributeValues: { ':pk': 'SF#SYSTEM', ':prefix': 'SYSTEM#' },
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(500)
    })
})
