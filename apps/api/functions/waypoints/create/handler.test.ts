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
            path: '/waypoints',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /waypoints',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /waypoints',
    rawPath: '/waypoints',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('waypoints/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 when url is missing', async () => {
        const result = await handler(mockEvent('user-123', { title: 'Example' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('url and title are required')
    })

    it('returns 400 when title is missing', async () => {
        const result = await handler(mockEvent('user-123', { url: 'https://example.com' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('url and title are required')
    })

    it('returns 201 with the created waypoint', async () => {
        const result = await handler(mockEvent('user-123', {
            url: 'https://example.com',
            title: 'Example',
        })) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^WAYPOINT#/)
        expect(data.url).toBe('https://example.com')
        expect(data.title).toBe('Example')
        expect(data.read).toBe(false)
        expect(data.readLater).toBe(false)
        expect(data.markers).toEqual([])
        expect(data.createdAt).toBeDefined()
    })

    it('writes waypoint to DynamoDB with correct structure', async () => {
        await handler(mockEvent('user-123', {
            url: 'https://example.com',
            title: 'Example',
        }))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Item: expect.objectContaining({
                        pk: 'USER#user-123',
                        url: 'https://example.com',
                        title: 'Example',
                        read: false,
                        readLater: false,
                    }),
                }),
            })
        )
    })

    it('sets gsi1pk and gsi1sk when trailId is provided', async () => {
        await handler(mockEvent('user-123', {
            url: 'https://example.com',
            title: 'Example',
            trailId: 'trail-abc',
        }))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Item: expect.objectContaining({
                        gsi1pk: 'TRAIL#trail-abc',
                    }),
                }),
            })
        )
    })

    it('embeds resolved markers when markerIds are provided', async () => {
        const mockMarker = {
            pk: 'USER#user-123',
            sk: 'MARKER#marker-1',
            name: 'Work',
            color: '#3b82f6',
        }
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [mockMarker] } }) // BatchGet
            .mockResolvedValueOnce({}) // Put

        const result = await handler(mockEvent('user-123', {
            url: 'https://example.com',
            title: 'Example',
            markerIds: ['marker-1'],
        })) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.markers).toHaveLength(1)
        expect(data.markers[0]).toMatchObject({ id: 'marker-1', name: 'Work', color: '#3b82f6' })
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', {
            url: 'https://example.com',
            title: 'Example',
        })) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
