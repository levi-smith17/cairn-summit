import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
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
            method: 'POST',
            path: '/logs',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /logs',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /logs',
    rawPath: '/logs',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('logs/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 when content is missing', async () => {
        const result = await handler(mockEvent('user-123', { title: 'My Log' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('content is required')
    })

    it('returns 201 with the created log', async () => {
        const result = await handler(mockEvent('user-123', { content: 'Hello world' })) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^LOG#/)
        expect(data.content).toBe('Hello world')
        expect(data.markers).toEqual([])
        expect(data.createdAt).toBeDefined()
        expect(data.updatedAt).toBeDefined()
    })

    it('includes optional title when provided', async () => {
        const result = await handler(mockEvent('user-123', {
            title: 'Meeting Notes',
            content: 'Discussed scope',
        })) as any

        const data = JSON.parse(result.body).data
        expect(data.title).toBe('Meeting Notes')
    })

    it('writes log to DynamoDB with correct structure', async () => {
        await handler(mockEvent('user-123', { content: 'Entry content' }))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Item: expect.objectContaining({
                        pk: 'USER#user-123',
                        content: 'Entry content',
                        markers: [],
                    }),
                }),
            })
        )
    })

    it('embeds resolved markers when markerIds are provided', async () => {
        const mockMarker = {
            pk: 'USER#user-123',
            sk: 'MARKER#marker-1',
            name: 'Personal',
            color: '#22c55e',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [mockMarker] } }) // BatchGet
            .mockResolvedValueOnce({}) // Put

        const result = await handler(mockEvent('user-123', {
            content: 'Entry content',
            markerIds: ['marker-1'],
        })) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.markers).toHaveLength(1)
        expect(data.markers[0]).toMatchObject({ id: 'marker-1', name: 'Personal', color: '#22c55e' })
    })

    it('stores trailId and waypointId when provided', async () => {
        const result = await handler(mockEvent('user-123', {
            content: 'Entry content',
            trailId: 'trail-abc',
            waypointId: 'wp-xyz',
        })) as any

        const data = JSON.parse(result.body).data
        expect(data.trailId).toBe('trail-abc')
        expect(data.waypointId).toBe('wp-xyz')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', { content: 'Entry content' })) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
