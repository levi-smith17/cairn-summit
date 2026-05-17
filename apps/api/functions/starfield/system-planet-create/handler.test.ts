import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id: string | undefined, body: Record<string, unknown>): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: `/starfield/systems/${id}/planets`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /starfield/systems/{id}/planets', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'POST /starfield/systems/{id}/planets', rawPath: `/starfield/systems/${id}/planets`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body), isBase64Encoded: false,
})

describe('starfield/system-planet-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('creates a planet and returns 201', async () => {
        const result = await handler(mockEvent('sol', { name: 'Earth' })) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Earth')
        expect(data.id).toBe('earth')
    })

    it('derives planet id from name using slug rules', async () => {
        const result = await handler(mockEvent('sol', { name: 'New Earth!' })) as any
        expect(JSON.parse(result.body).data.id).toBe('new-earth-')
    })

    it('appends planet to system via list_append', async () => {
        await handler(mockEvent('sol', { name: 'Mars' }))
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'SF#SYSTEM', sk: 'SYSTEM#sol' },
                    UpdateExpression: 'SET planets = list_append(if_not_exists(planets, :empty), :planet)',
                    ExpressionAttributeValues: expect.objectContaining({
                        ':planet': [{ id: 'mars', name: 'Mars' }],
                        ':empty': [],
                    }),
                }),
            })
        )
    })

    it('returns 400 when system id is missing', async () => {
        const result = await handler(mockEvent(undefined, { name: 'Earth' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing system id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(mockEvent('sol', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name is required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('sol', { name: 'Earth' })) as any
        expect(result.statusCode).toBe(500)
    })
})
