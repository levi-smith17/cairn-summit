import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, id: string | undefined): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/signals/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /signals/{id}', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /signals/{id}',
    rawPath: `/signals/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('signals/delete handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing signal id')
    })

    it('returns 204 when signal does not exist', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123', 'sig-abc')) as any
        expect(result.statusCode).toBe(204)
    })

    it('returns 204 and deletes signal with its replies', async () => {
        const items = [
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-abc' },
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-abc#REPLY#reply-1' },
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-abc#REPLY#reply-2' },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: items }) // QueryCommand
            .mockResolvedValue({})                   // BatchWriteCommand

        const result = await handler(mockEvent('user-123', 'sig-abc')) as any
        expect(result.statusCode).toBe(204)
    })

    it('queries with the signal prefix to capture all replies', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'SIGNAL#sig-abc' }] })
            .mockResolvedValue({})

        await handler(mockEvent('user-123', 'sig-abc'))

        const queryCall = vi.mocked(dynamo.send).mock.calls[0]
        expect(queryCall[0].input.ExpressionAttributeValues[':prefix']).toBe('SIGNAL#sig-abc')
    })

    it('batch-deletes all found items', async () => {
        const items = [
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-abc' },
            { pk: 'USER#user-123', sk: 'SIGNAL#sig-abc#REPLY#reply-1' },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: items })
            .mockResolvedValue({})

        await handler(mockEvent('user-123', 'sig-abc'))

        const batchCall = vi.mocked(dynamo.send).mock.calls[1]
        expect(batchCall[0].input.RequestItems['cairn-test']).toHaveLength(2)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123', 'sig-abc')) as any
        expect(result.statusCode).toBe(500)
    })
})
