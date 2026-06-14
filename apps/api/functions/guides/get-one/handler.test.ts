import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id?: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub: 'user-123', email: 'test@cairn.local' },
                scopes: [],
            },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'GET',
            path: id ? `/guides/${id}` : '/guides',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /guides/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /guides/{id}',
    rawPath: id ? `/guides/${id}` : '/guides',
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('guides/get-one handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns guide with stones', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({
                Item: {
                    pk: 'USER#user-123',
                    sk: 'GUIDE#g1',
                    name: 'Spanish',
                    description: null,
                    trailId: null,
                    createdAt: '2024-01-01',
                },
            })
            .mockResolvedValueOnce({
                Items: [{
                    sk: 'STONE#g1#s1',
                    face: 'hola',
                    core: 'hello',
                    placement: 'UNPLACED',
                    markers: [],
                }],
            })

        const result = await handler(mockEvent('g1')) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data.name).toBe('Spanish')
        expect(data.stones).toHaveLength(1)
        expect(data.stones[0].face).toBe('hola')
    })

    it('returns 404 when guide is missing', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: undefined })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('missing')) as any
        expect(result.statusCode).toBe(404)
    })
})
