import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    id: string | undefined,
    planetId: string | undefined,
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/starfield/systems/${id}/planets/${planetId}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /starfield/systems/{id}/planets/{planetId}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'DELETE /starfield/systems/{id}/planets/{planetId}',
    rawPath: `/starfield/systems/${id}/planets/${planetId}`,
    rawQueryString: '', headers: {},
    pathParameters: id && planetId ? { id, planetId } : undefined,
    isBase64Encoded: false,
})

describe('starfield/system-planet-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('removes planet from system and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { pk: 'SF#SYSTEM', sk: 'SYSTEM#sol', planets: [{ id: 'earth', name: 'Earth' }, { id: 'mars', name: 'Mars' }] } })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('sol', 'earth')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledTimes(2)

        const updateCall = vi.mocked(dynamo.send).mock.calls[1][0]
        expect((updateCall as any).input.ExpressionAttributeValues[':planets']).toEqual([{ id: 'mars', name: 'Mars' }])
    })

    it('returns 404 when system not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })
        const result = await handler(mockEvent('sol', 'earth')) as any
        expect(result.statusCode).toBe(404)
        expect(dynamo.send).toHaveBeenCalledTimes(1)
    })

    it('returns 400 when system id is missing', async () => {
        const result = await handler(mockEvent(undefined, 'earth')) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing system or planet id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when planetId is missing', async () => {
        const result = await handler(mockEvent('sol', undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('sol', 'earth')) as any
        expect(result.statusCode).toBe(500)
    })
})
