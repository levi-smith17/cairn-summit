import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string | undefined, body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/starfield/outposts/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/outposts/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/outposts/{id}', rawPath: `/starfield/outposts/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/outpost-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('updates outpost and returns 200 with resources as array', async () => {
        const attrs = {
            pk: 'USER#user-1', sk: 'SF#FACILITY#outpost-1',
            system: 'Sol', planet: 'Earth',
            resources: { 'res-1': { resourceId: 'res-1', name: 'Iron' } },
        }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: attrs })

        const result = await handler(mockEvent('user-1', 'outpost-1', { system: 'Sol' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(Array.isArray(data.resources)).toBe(true)
        expect(data.resources).toHaveLength(1)
        expect(data.resources[0].resourceId).toBe('res-1')
    })

    it('updates planet field', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { resources: {} } })
        await handler(mockEvent('user-1', 'outpost-1', { planet: 'Mars' }))
        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect((call as any).input.ExpressionAttributeValues[':planet']).toBe('Mars')
    })

    it('updates transferStationLimit', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { resources: {} } })
        await handler(mockEvent('user-1', 'outpost-1', { transferStationLimit: 64 }))
        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect((call as any).input.ExpressionAttributeValues[':transferStationLimit']).toBe(64)
    })

    it('returns empty array when outpost has no resources', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: {} })
        const result = await handler(mockEvent('user-1', 'outpost-1', { system: 'Sol' })) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.resources).toEqual([])
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-1', undefined, { system: 'Sol' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing outpost id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when no updatable fields provided', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No updatable fields provided')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('ignores non-allowed fields', async () => {
        const result = await handler(mockEvent('user-1', 'outpost-1', { hacked: true })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1', 'outpost-1', { system: 'Sol' })) as any
        expect(result.statusCode).toBe(500)
    })
})
