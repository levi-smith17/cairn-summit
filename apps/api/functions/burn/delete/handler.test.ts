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
    id: string | undefined
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
            method: 'DELETE',
            path: id ? `/burn/${id}` : '/burn',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'DELETE /burn/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /burn/{id}',
    rawPath: id ? `/burn/${id}` : '/burn',
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('burn/delete handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('deletes a burn and returns 204', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({}))

        const result = await handler(mockEvent('user-123', 'abc')) as any

        expect(result.statusCode).toBe(204)
    })

    it('calls DynamoDB with correct key', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({}))

        await handler(mockEvent('user-456', 'xyz'))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: {
                        pk: 'USER#user-456',
                        sk: 'BURN#xyz',
                    },
                }),
            })
        )
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined)) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing burn id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(mockEvent('user-123', 'abc')) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
