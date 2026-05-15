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
            path: `/guides/${guideId}/stones/import`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'POST /guides/{guideId}/stones/import',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /guides/{guideId}/stones/import',
    rawPath: `/guides/${guideId}/stones/import`,
    rawQueryString: '',
    headers: {},
    pathParameters: guideId ? { guideId } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('guides/stones-import handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('imports multiple stones and returns count', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': [
                { pk: 'USER#user-123', sk: 'MARKER#m1', name: 'Trail', color: '#FF0000' },
                { pk: 'USER#user-123', sk: 'MARKER#m2', name: 'Camp', color: '#00FF00' },
            ] } })
            .mockResolvedValueOnce({})

        const result = await handler(
            mockEvent('user-123', 'g1', { stones: [
                { face: 'front', core: 'granite', markerIds: ['m1', 'm2'] },
                { face: 'back', core: 'slate', markerIds: ['m1'] },
            ] })
        ) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual({ count: 2 })
        expect(dynamo.send).toHaveBeenCalledTimes(2)
    })

    it('returns 400 when no stones are provided', async () => {
        const result = await handler(mockEvent('user-123', 'g1', { stones: [] })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('stones array is required and must not be empty')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when guideId is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { stones: [{ face: 'front', core: 'granite', markerIds: [] }] })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing guideId')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'g1', { stones: [{ face: 'front', core: 'granite', markerIds: [] }] })) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
