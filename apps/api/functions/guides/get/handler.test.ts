import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
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
            path: '/guides',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /guides',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /guides',
    rawPath: '/guides',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

describe('guides/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when no guides exist', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123')) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual([])
    })

    it('returns guides with nested stones', async () => {
        const guides = [
            { pk: 'USER#user-123', sk: 'GUIDE#g1', name: 'Guide One', createdAt: '2026-01-01T00:00:00.000Z' },
        ]
        const stones = [
            { pk: 'USER#user-123', sk: 'STONE#g1#s1', face: 'front', core: 'granite', placement: 'UNPLACED', markers: [] },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: guides })
            .mockResolvedValueOnce({ Items: stones })

        const result = await handler(mockEvent('user-123')) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data).toEqual([
            {
                pk: 'USER#user-123',
                sk: 'GUIDE#g1',
                id: 'g1',
                name: 'Guide One',
                description: undefined,
                trailId: undefined,
                createdAt: '2026-01-01T00:00:00.000Z',
                stones: [
                    { id: 's1', face: 'front', core: 'granite', placement: 'UNPLACED', markers: [] },
                ],
            },
        ])
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123')) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
