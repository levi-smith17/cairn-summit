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
    body: Record<string, unknown>,
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/starfield/systems/${id}/planets/${planetId}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /starfield/systems/{id}/planets/{planetId}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'PUT /starfield/systems/{id}/planets/{planetId}',
    rawPath: `/starfield/systems/${id}/planets/${planetId}`,
    rawQueryString: '', headers: {},
    pathParameters: id && planetId ? { id, planetId } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/system-planet-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('updates planet name and returns 200', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { planets: [{ id: 'earth', name: 'Earth' }] } })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('sol', 'earth', { name: 'New Earth' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('New Earth')
        expect(data.id).toBe('new-earth')
    })

    it('saves updated planets array to DynamoDB', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { planets: [{ id: 'earth', name: 'Earth' }, { id: 'mars', name: 'Mars' }] } })
            .mockResolvedValueOnce({})

        await handler(mockEvent('sol', 'earth', { name: 'Terra' }))

        const updateCall = vi.mocked(dynamo.send).mock.calls[1][0]
        const updatedPlanets = (updateCall as any).input.ExpressionAttributeValues[':planets']
        expect(updatedPlanets[0]).toEqual({ id: 'terra', name: 'Terra' })
        expect(updatedPlanets[1]).toEqual({ id: 'mars', name: 'Mars' })
    })

    it('returns 404 when system not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })
        const result = await handler(mockEvent('sol', 'earth', { name: 'Terra' })) as any
        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('System not found')
        expect(dynamo.send).toHaveBeenCalledTimes(1)
    })

    it('returns 404 when planet not found in system', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: { planets: [{ id: 'mars', name: 'Mars' }] } })
        const result = await handler(mockEvent('sol', 'earth', { name: 'Terra' })) as any
        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('Planet not found')
        expect(dynamo.send).toHaveBeenCalledTimes(1)
    })

    it('returns 400 when system id is missing', async () => {
        const result = await handler(mockEvent(undefined, 'earth', { name: 'Terra' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing system or planet id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when planetId is missing', async () => {
        const result = await handler(mockEvent('sol', undefined, { name: 'Terra' })) as any
        expect(result.statusCode).toBe(400)
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent('sol', 'earth', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name is required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('sol', 'earth', { name: 'Terra' })) as any
        expect(result.statusCode).toBe(500)
    })
})
