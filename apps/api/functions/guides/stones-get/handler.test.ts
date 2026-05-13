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
    guideId: string | undefined
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
            path: `/guides/${guideId}/stones`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /guides/{guideId}/stones',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /guides/{guideId}/stones',
    rawPath: `/guides/${guideId}/stones`,
    rawQueryString: '',
    headers: {},
    pathParameters: guideId ? { guideId } : undefined,
    isBase64Encoded: false,
})

describe('guides/stones-get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns stones for the guide', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [
            { pk: 'USER#user-123', sk: 'STONE#g1#s1', guideId: 'g1', face: 'front', core: 'granite', placement: 'UNPLACED', markers: [], createdAt: '2026-01-01T00:00:00.000Z' },
        ] })

        const result = await handler(mockEvent('user-123', 'g1')) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data).toEqual([
            {
                pk: 'USER#user-123',
                sk: 'STONE#g1#s1',
                id: 's1',
                guideId: 'g1',
                face: 'front',
                core: 'granite',
                placement: 'UNPLACED',
                markers: [],
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ])
    })

    it('returns 400 when guideId is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined)) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing guideId')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'g1')) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
