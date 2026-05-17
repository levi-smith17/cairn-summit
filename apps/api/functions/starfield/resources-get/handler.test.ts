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
        http: { method: 'GET', path: '/starfield/resources', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /starfield/resources', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'GET /starfield/resources', rawPath: '/starfield/resources',
    rawQueryString: '', headers: {}, isBase64Encoded: false,
})

describe('starfield/resources-get handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns all global resources', async () => {
        const resources = [
            { pk: 'SF#RESOURCE', sk: 'RESOURCE#a', name: 'Iron', abbreviation: 'Fe' },
            { pk: 'SF#RESOURCE', sk: 'RESOURCE#b', name: 'Coal', abbreviation: 'Co' },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: resources })

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(resources)
    })

    it('returns empty array when no resources exist', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('queries with SF#RESOURCE pk and RESOURCE# prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        await handler(mockEvent())
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    ExpressionAttributeValues: { ':pk': 'SF#RESOURCE', ':prefix': 'RESOURCE#' },
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
