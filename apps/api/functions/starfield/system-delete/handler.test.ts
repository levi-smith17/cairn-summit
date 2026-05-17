import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (id: string | undefined): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'admin', email: 'admin@cairn.local' }, scopes: [] }, principalId: '', integrationLatency: 0 },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/starfield/systems/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /starfield/systems/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0', routeKey: 'DELETE /starfield/systems/{id}', rawPath: `/starfield/systems/${id}`,
    rawQueryString: '', headers: {}, pathParameters: id ? { id } : undefined, isBase64Encoded: false,
})

describe('starfield/system-delete handler', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('deletes system and returns 204', async () => {
        const result = await handler(mockEvent('sol')) as any
        expect(result.statusCode).toBe(204)
        expect(dynamo.send).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    Key: { pk: 'SF#SYSTEM', sk: 'SYSTEM#sol' },
                }),
            })
        )
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing system id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('sol')) as any
        expect(result.statusCode).toBe(500)
    })
})
