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
            method: 'PATCH',
            path: id ? `/burn/${id}` : '/burn',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PATCH /burn/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PATCH /burn/{id}',
    rawPath: id ? `/burn/${id}` : '/burn',
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('burn/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates a burn and returns 200', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Attributes: {
            pk: 'USER#user-123',
            sk: 'BURN#abc',
            name: 'Updated burn',
            amount: 9.99,
            date: '2026-05-15',
            markers: [],
        }}))

        const result = await handler(
            mockEvent('user-123', 'abc', { name: 'Updated burn', amount: 9.99, date: '2026-05-15' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Updated burn')
        expect(data.amount).toBe(9.99)
        expect(data.date).toBe('2026-05-15')
    })

    it('updates markerIds and embeds markers', async () => {
        vi.mocked(dynamo.send)
            .mockImplementationOnce(() => Promise.resolve({
                Responses: {
                    'cairn-test': [
                        { pk: 'USER#user-123', sk: 'MARKER#marker-1', name: 'Trail', color: '#00FF00' },
                    ],
                    'cairn-dev': [
                        { pk: 'USER#user-123', sk: 'MARKER#marker-1', name: 'Trail', color: '#00FF00' },
                    ],
                },
            }))
            .mockImplementationOnce(() => Promise.resolve({ Attributes: {
                pk: 'USER#user-123',
                sk: 'BURN#abc',
                markers: [{ id: 'marker-1', name: 'Trail', color: '#00FF00' }],
            }}))

        const result = await handler(
            mockEvent('user-123', 'abc', { markerIds: ['marker-1'] })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.markers).toEqual([{ id: 'marker-1', name: 'Trail', color: '#00FF00' }])
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { name: 'No id' })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing burn id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when no valid fields are provided', async () => {
        const result = await handler(mockEvent('user-123', 'abc', { invalid: true })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No valid fields to update')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(
            mockEvent('user-123', 'abc', { name: 'Bad update' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
