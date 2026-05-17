import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string,
    id: string | undefined,
    body: Record<string, unknown>
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
            method: 'PUT',
            path: `/guides/stones/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /guides/stones/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /guides/stones/{id}',
    rawPath: `/guides/stones/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('stones/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates stone face and core and returns 200', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'STONE#guide-1#abc',
            face: 'front',
            core: 'granite',
        }

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'STONE#guide-1#abc' }] })
            .mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(
            mockEvent('user-123', 'abc', { face: 'front', core: 'granite' })
        ) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('updates stone markers when markerIds are provided', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'STONE#guide-1#abc',
            markers: [
                { id: 'marker-1', name: 'Trail', color: '#FF0000' },
            ],
        }

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'STONE#guide-1#abc' }] })
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [{ pk: 'USER#user-123', sk: 'MARKER#marker-1', name: 'Trail', color: '#FF0000' }] } })
            .mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(
            mockEvent('user-123', 'abc', { markerIds: ['marker-1'] })
        ) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.markers).toEqual(updated.markers)
    })

    it('updates stone markers to empty array when markerIds is empty', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'STONE#guide-1#abc' }] })
            .mockResolvedValueOnce({ Attributes: { pk: 'USER#user-123', sk: 'STONE#guide-1#abc', markers: [] } })

        const result = await handler(
            mockEvent('user-123', 'abc', { markerIds: [] })
        ) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.markers).toEqual([])
        expect(dynamo.send).toHaveBeenCalledTimes(2)
    })

    it('returns 400 when no fields are supplied', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'STONE#guide-1#abc' }] })

        const result = await handler(
            mockEvent('user-123', 'abc', {})
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No fields to update')
        expect(dynamo.send).toHaveBeenCalledTimes(1)
    })

    it('returns 404 when stone is not found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(
            mockEvent('user-123', 'abc', { face: 'front' })
        ) as any

        expect(result.statusCode).toBe(404)
        expect(JSON.parse(result.body).error).toBe('Stone not found')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(
            mockEvent('user-123', 'abc', { face: 'front' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
