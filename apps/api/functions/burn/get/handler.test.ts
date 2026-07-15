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
    queryStringParameters: Record<string, string> | undefined
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
            path: '/burn',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /burn',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /burn',
    rawPath: '/burn',
    rawQueryString: '',
    headers: {},
    queryStringParameters,
    isBase64Encoded: false,
})

describe('burn/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns burns for the requested month and year', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({
            Items: [
                {
                    pk: 'USER#user-123',
                    sk: 'BURN#abc',
                    name: 'Coffee',
                    amount: 3.5,
                    date: '2026-05-10',
                    markers: [],
                },
            ],
        }))

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.total).toBe(1)
        expect(data.page).toBe(1)
        expect(data.pageSize).toBe(20)
        expect(data.burn[0].id).toBe('abc')
        expect(data.burn[0].name).toBe('Coffee')
    })

    it('returns 400 when month or year is missing', async () => {
        const result = await handler(
            mockEvent('user-123', { month: '5' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year are required')
    })

    it('returns 400 when month or year is not numeric', async () => {
        const result = await handler(
            mockEvent('user-123', { month: 'May', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('month and year must be numbers')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { month: '5', year: '2026' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })

    it('filters by fundId and unassigned', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({
            Items: [
                {
                    pk: 'USER#user-123',
                    sk: 'BURN#a',
                    name: 'Funded',
                    amount: 10,
                    date: '2026-05-10',
                    fundId: 'fund-1',
                    markers: [],
                },
                {
                    pk: 'USER#user-123',
                    sk: 'BURN#b',
                    name: 'Unfunded',
                    amount: 5,
                    date: '2026-05-11',
                    markers: [],
                },
            ],
        }))

        const funded = await handler(
            mockEvent('user-123', { month: '5', year: '2026', fundId: 'fund-1' })
        ) as any
        expect(JSON.parse(funded.body).data.burn.map((b: { name: string }) => b.name)).toEqual(['Funded'])

        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({
            Items: [
                {
                    pk: 'USER#user-123',
                    sk: 'BURN#a',
                    name: 'Funded',
                    amount: 10,
                    date: '2026-05-10',
                    fundId: 'fund-1',
                    markers: [],
                },
                {
                    pk: 'USER#user-123',
                    sk: 'BURN#b',
                    name: 'Unfunded',
                    amount: 5,
                    date: '2026-05-11',
                    markers: [],
                },
            ],
        }))

        const unassigned = await handler(
            mockEvent('user-123', { month: '5', year: '2026', fundId: 'unassigned' })
        ) as any
        expect(JSON.parse(unassigned.body).data.burn.map((b: { name: string }) => b.name)).toEqual(['Unfunded'])
    })
})
