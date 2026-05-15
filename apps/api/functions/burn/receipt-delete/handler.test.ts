import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))
vi.mock('../../shared/s3', () => ({
    s3: { send: vi.fn() },
    PRIVATE_MEDIA_BUCKET: 'cairn-test-private-media',
}))
vi.mock('@aws-sdk/client-s3', () => ({ DeleteObjectCommand: vi.fn() }))

import { handler } from './handler'
import { dynamo } from '../../shared/db'
import { s3 } from '../../shared/s3'

const mockEvent = (sub: string, key?: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: '/burn/receipt-delete', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /burn/receipt-delete', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /burn/receipt-delete',
    rawPath: '/burn/receipt-delete',
    rawQueryString: '',
    headers: {},
    queryStringParameters: key ? { key } : undefined,
    isBase64Encoded: false,
})

describe('burn/receipt-delete handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when key is missing', async () => {
        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 403 when key belongs to a different user', async () => {
        const result = await handler(mockEvent('user-123', 'receipts/user-999/receipt.jpg')) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 404 when no matching expense is found', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('user-123', 'receipts/user-123/receipt.jpg')) as any
        expect(result.statusCode).toBe(404)
    })

    it('deletes from S3 and clears receiptUrl from DynamoDB', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'BURN#expense-1' }] })
            .mockResolvedValueOnce({}) // UpdateCommand
        vi.mocked(s3.send).mockResolvedValueOnce({})

        const result = await handler(mockEvent('user-123', 'receipts/user-123/receipt.jpg')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.deleted).toBe(true)

        const calls = vi.mocked(dynamo.send).mock.calls
        const updateCall = calls.find(c => c[0].input.UpdateExpression === 'REMOVE receiptUrl')
        expect(updateCall).toBeDefined()
        expect(vi.mocked(s3.send)).toHaveBeenCalledOnce()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-123', 'receipts/user-123/receipt.jpg')) as any
        expect(result.statusCode).toBe(500)
    })
})
