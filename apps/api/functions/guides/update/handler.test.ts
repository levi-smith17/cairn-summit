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
            path: `/guides/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /guides/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /guides/{id}',
    rawPath: `/guides/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('guides/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates guide name and description and returns 200', async () => {
        const updated = { pk: 'USER#user-123', sk: 'GUIDE#g1', name: 'New Guide', description: 'Updated', trailId: 'trail-1' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('user-123', 'g1', { name: 'New Guide', description: 'Updated', trailId: 'trail-1' })) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('removes description and trailId when null is passed', async () => {
        const updated = { pk: 'USER#user-123', sk: 'GUIDE#g1', name: 'Guide Name' }
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: updated })

        const result = await handler(mockEvent('user-123', 'g1', { name: 'Guide Name', description: null, trailId: null })) as any

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { name: 'Guide Name' })) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing guide id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when no fields are supplied', async () => {
        const result = await handler(mockEvent('user-123', 'g1', {})) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No fields to update')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'g1', { name: 'Guide Name' })) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
