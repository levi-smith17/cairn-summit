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
            method: 'PUT',
            path: `/guides/${guideId}/stones/placements-reset`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /guides/{guideId}/stones/placements-reset',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /guides/{guideId}/stones/placements-reset',
    rawPath: `/guides/${guideId}/stones/placements-reset`,
    rawQueryString: '',
    headers: {},
    pathParameters: guideId ? { guideId } : undefined,
    isBase64Encoded: false,
})

describe('guides/placements-reset handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('resets stone placements and returns 204', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [
                { pk: 'USER#user-123', sk: 'STONE#g1#s1' },
                { pk: 'USER#user-123', sk: 'STONE#g1#s2' },
            ] })
            .mockResolvedValue({})

        const result = await handler(mockEvent('user-123', 'g1')) as any

        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledTimes(3)
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
