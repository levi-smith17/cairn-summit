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
            method: 'POST',
            path: '/burn',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /burn',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /burn',
    rawPath: '/burn',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('burn/create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a burn and returns 201', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({}))

        const result = await handler(
            mockEvent('user-123', { name: 'Snacks', amount: 12.5, date: '2026-05-13' })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Snacks')
        expect(data.amount).toBe(12.5)
        expect(data.date).toBe('2026-05-13')
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^BURN#/) 
        expect(data.markers).toEqual([])
    })

    it('resolves markerIds and embeds markers', async () => {
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
            .mockImplementationOnce(() => Promise.resolve({}))

        const result = await handler(
            mockEvent('user-123', {
                name: 'Meal', amount: 7.95, date: '2026-05-14', markerIds: ['marker-1'],
            })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.markers).toEqual([
            { id: 'marker-1', name: 'Trail', color: '#00FF00' },
        ])
    })

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(
            mockEvent('user-123', { name: 'Missing date', amount: 5 })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('name, amount, and date are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(
            mockEvent('user-123', { name: 'Error burn', amount: 1, date: '2026-05-13' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
