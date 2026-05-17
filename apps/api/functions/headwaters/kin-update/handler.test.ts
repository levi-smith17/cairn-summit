import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string | undefined, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/headwaters/kin/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /headwaters/kin/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /headwaters/kin/{id}',
    rawPath: `/headwaters/kin/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('headwaters/kin-update handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined, { givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent('user-123', 'abc', { fatherUnknown: false, motherUnknown: false, bloodlines: [] })) as any
        expect(result.statusCode).toBe(400)
    })

    it('updates kin and returns 200', async () => {
        const updated = { pk: 'USER#user-123', sk: 'KIN#abc', givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Attributes: updated }))

        const body = { givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] }
        const result = await handler(mockEvent('user-123', 'abc', body)) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data).toEqual(updated)
    })

    it('uses REMOVE for absent optional fields', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.resolve({ Attributes: {} }))

        const body = { givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] }
        await handler(mockEvent('user-123', 'abc', body))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    UpdateExpression: expect.stringContaining('REMOVE'),
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const body = { givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] }
        const result = await handler(mockEvent('user-123', 'abc', body)) as any
        expect(result.statusCode).toBe(500)
    })
})
