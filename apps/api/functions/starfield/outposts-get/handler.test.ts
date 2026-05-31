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
        authorizer: { jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/starfield/outposts', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /starfield/outposts', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'GET /starfield/outposts', rawPath: '/starfield/outposts',
    rawQueryString: '', headers: {}, isBase64Encoded: false,
})

describe('starfield/outposts-get handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns outposts with resources as arrays', async () => {
        const items = [
            { pk: 'USER#user-1', sk: 'SF#FACILITY#a', system: 'Sol', resources: { r1: { resourceId: 'r1', name: 'Iron', fromOutpostId: null } } },
            { pk: 'USER#user-1', sk: 'SF#FACILITY#b', system: 'Alpha', resources: {} },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: items })

        const result = await handler(mockEvent('user-1')) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data).toHaveLength(2)
        expect(Array.isArray(data[0].resources)).toBe(true)
        expect(data[0].resources[0].resourceId).toBe('r1')
        expect(Array.isArray(data[1].resources)).toBe(true)
        expect(data[1].resources).toHaveLength(0)
    })

    it('migrates legacy fromFacilityId into supplies', async () => {
        const items = [
            { pk: 'USER#user-1', sk: 'SF#FACILITY#a', resources: { r1: { resourceId: 'r1', name: 'Iron', abbreviation: 'Fe', onsite: false, fromFacilityId: 'old-id' } } },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: items })

        const result = await handler(mockEvent('user-1')) as any
        const resource = JSON.parse(result.body).data[0].resources[0]
        expect(resource.supplies[0].fromOutpostId).toBe('old-id')
    })

    it('prefers fromOutpostId over fromFacilityId in supplies migration', async () => {
        const items = [
            { pk: 'USER#user-1', sk: 'SF#FACILITY#a', resources: { r1: { resourceId: 'r1', name: 'Iron', abbreviation: 'Fe', onsite: false, fromOutpostId: 'new-id', fromFacilityId: 'old-id' } } },
        ]
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: items })

        const result = await handler(mockEvent('user-1')) as any
        expect(JSON.parse(result.body).data[0].resources[0].supplies[0].fromOutpostId).toBe('new-id')
    })

    it('returns empty array when user has no outposts', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        const result = await handler(mockEvent('user-1')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('queries with correct pk and SK prefix', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })
        await handler(mockEvent('user-42'))
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    ExpressionAttributeValues: { ':pk': 'USER#user-42', ':prefix': 'SF#FACILITY#' },
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
