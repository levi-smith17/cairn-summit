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
            path: `/markers/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /markers/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /markers/{id}',
    rawPath: `/markers/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('markers/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates a marker and returns 200', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'MARKER#abc',
            name: 'Updated Summit',
            color: '#0000FF',
            icon: null,
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Attributes: updated }))

        const result = await handler(
            mockEvent('user-123', 'abc', { name: 'Updated Summit', color: '#0000FF' })
        ) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('updates a marker with icon', async () => {
        const updated = {
            pk: 'USER#user-123',
            sk: 'MARKER#abc',
            name: 'Camp',
            color: '#00FF00',
            icon: 'tent',
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Attributes: updated }))

        const result = await handler(
            mockEvent('user-123', 'abc', { name: 'Camp', color: '#00FF00', icon: 'tent' })
        ) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.icon).toBe('tent')
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(
            mockEvent('user-123', undefined, { name: 'Summit', color: '#FF0000' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing marker id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
        const result = await handler(
            mockEvent('user-123', 'abc', { color: '#FF0000' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name and color are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when color is missing', async () => {
        const result = await handler(
            mockEvent('user-123', 'abc', { name: 'Summit' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name and color are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', 'abc', { name: 'Summit', color: '#FF0000' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})