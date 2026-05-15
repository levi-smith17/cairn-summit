import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))
vi.mock('../../shared/s3', () => ({
    s3: {},
    PRIVATE_MEDIA_BUCKET: 'cairn-test-private-media',
    PRESIGN_EXPIRES: 3600,
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-get'),
}))
vi.mock('@aws-sdk/client-s3', () => ({ GetObjectCommand: vi.fn() }))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (sub: string, key?: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/burn/receipt-url', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /burn/receipt-url', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /burn/receipt-url',
    rawPath: '/burn/receipt-url',
    rawQueryString: '',
    headers: {},
    queryStringParameters: key ? { key } : undefined,
    isBase64Encoded: false,
})

describe('burn/receipt-url handler', () => {
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

    it('returns 302 redirect for a valid owned receipt', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Items: [{ pk: 'USER#user-123', sk: 'BURN#expense-1' }],
        })

        const result = await handler(mockEvent('user-123', 'receipts/user-123/receipt.jpg')) as any
        expect(result.statusCode).toBe(302)
        expect(result.headers['Location']).toBe('https://s3.example.com/presigned-get')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-123', 'receipts/user-123/receipt.jpg')) as any
        expect(result.statusCode).toBe(500)
    })
})
