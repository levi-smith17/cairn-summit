import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/headwaters/kin', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /headwaters/kin', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /headwaters/kin',
    rawPath: '/headwaters/kin',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('headwaters/kin-create handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('returns 400 when givenName is missing', async () => {
        const result = await handler(mockEvent('user-123', { surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when surname is missing', async () => {
        const result = await handler(mockEvent('user-123', { givenName: 'Jane', fatherUnknown: false, motherUnknown: false, bloodlines: [] })) as any
        expect(result.statusCode).toBe(400)
    })

    it('creates kin and returns 201', async () => {
        const body = {
            givenName: 'Jane', surname: 'Smith',
            fatherUnknown: false, motherUnknown: false,
            bloodlines: [],
        }
        const result = await handler(mockEvent('user-123', body)) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.givenName).toBe('Jane')
        expect(data.surname).toBe('Smith')
        expect(data.pk).toBe('USER#user-123')
        expect(data.sk).toMatch(/^KIN#/)
    })

    it('puts item with correct pk', async () => {
        const body = { givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] }
        await handler(mockEvent('user-456', body))

        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Item: expect.objectContaining({ pk: 'USER#user-456' }),
                }),
            })
        )
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const body = { givenName: 'Jane', surname: 'Smith', fatherUnknown: false, motherUnknown: false, bloodlines: [] }
        const result = await handler(mockEvent('user-123', body)) as any
        expect(result.statusCode).toBe(500)
    })
})
