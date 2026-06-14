import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

// Mock the shared db module before importing handler
vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
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
            method: 'GET',
            path: '/markers',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /markers',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /markers',
    rawPath: '/markers',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

describe('markers/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when user has no markers', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('returns markers for the user', async () => {
        const markers = [
            {
                pk: 'USER#user-123',
                sk: 'MARKER#abc',
                name: 'Summit',
                color: '#FF0000',
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: markers })
            .mockResolvedValueOnce({ Items: [
                { sk: 'WAYPOINT#w1', markers: [{ markerId: 'abc' }] },
            ]})

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data[0].waypointCount).toBe(1)
    })

    it('queries with correct pk and sk prefix', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        await handler(mockEvent('user-456'))

        expect(dynamo.send).toHaveBeenCalledTimes(2)
        expect(dynamo.send).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                input: expect.objectContaining({
                    ExpressionAttributeValues: {
                        ':pk': 'USER#user-456',
                        ':prefix': 'MARKER#',
                    },
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})