import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/profile', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /profile', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'GET /profile',
    rawPath: '/profile',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

const mockProfile = {
    pk: 'USER#user-123',
    sk: 'PROFILE',
    username: 'levi',
    name: 'Levi Smith',
    email: 'levi@example.com',
    image: null,
    isAdmin: false,
}

describe('profile/get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 404 when profile does not exist', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: undefined }) // GetItem
            .mockResolvedValueOnce({ Count: 0 })        // signal count
            .mockResolvedValueOnce({ Count: 0 })        // stop count

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(404)
    })

    it('returns profile with signal and stop counts', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockProfile })
            .mockResolvedValueOnce({ Items: [
                    { sk: 'SIGNAL#s1' },
                    { sk: 'SIGNAL#s2' },
                    { sk: 'SIGNAL#s3' },
                ]})
            .mockResolvedValueOnce({ Count: 7 })

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.username).toBe('levi')
        expect(data.email).toBe('levi@example.com')
        expect(data.signals).toBe(3)
        expect(data.itinerary).toBe(7)
        expect(data.isAdmin).toBe(false)
    })

    it('returns zero counts when DynamoDB returns no Count', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockProfile })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.signals).toBe(0)
        expect(data.itinerary).toBe(0)
    })

    it('returns null for missing optional fields', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { pk: 'USER#user-123', sk: 'PROFILE', username: 'levi', email: 'levi@example.com' } })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Count: 0 })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data
        expect(data.name).toBeNull()
        expect(data.image).toBeNull()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(500)
    })

    it('excludes reply signals from count', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockProfile })
            .mockResolvedValueOnce({ Items: [
                    { sk: 'SIGNAL#s1' },
                    { sk: 'SIGNAL#s1#REPLY#r1' }, // should be excluded
                    { sk: 'SIGNAL#s1#REPLY#r2' }, // should be excluded
                ]})
            .mockResolvedValueOnce({ Count: 0 })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data
        expect(data.signals).toBe(1)
    })
})
