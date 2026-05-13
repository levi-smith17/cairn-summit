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
    guideId: string | undefined,
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
            path: `/guides/${guideId}/stones`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /guides/{guideId}/stones',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /guides/{guideId}/stones',
    rawPath: `/guides/${guideId}/stones`,
    rawQueryString: '',
    headers: {},
    pathParameters: guideId ? { guideId } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('guides/stones-create handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates a stone with required fields and returns 201', async () => {
        const result = await handler(
            mockEvent('user-123', 'g1', { face: 'front', core: 'granite' })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.face).toBe('front')
        expect(data.core).toBe('granite')
        expect(data.guideId).toBe('g1')
        expect(data.placement).toBe('UNPLACED')
        expect(data.id).toBeDefined()
    })

    it('creates a stone with resolved markers when markerIds are provided', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Responses: { 'cairn-test': [
            { pk: 'USER#user-123', sk: 'MARKER#m1', name: 'Trail', color: '#FF0000' },
        ] } })

        const result = await handler(
            mockEvent('user-123', 'g1', { face: 'front', core: 'granite', markerIds: ['m1'] })
        ) as any

        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.markers).toEqual([{ id: 'm1', name: 'Trail', color: '#FF0000' }])
    })

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(
            mockEvent('user-123', 'g1', { face: 'front' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('face and core are required')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(
            mockEvent('user-123', 'g1', { face: 'front', core: 'granite' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
