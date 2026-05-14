import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/s3', () => ({
    s3: {},
    PRIVATE_MEDIA_BUCKET: 'cairn-test-private-media',
    PRESIGN_EXPIRES: 3600,
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-put'),
}))
vi.mock('@aws-sdk/client-s3', () => ({ PutObjectCommand: vi.fn() }))

import { handler } from './handler'

const mockEvent = (sub: string, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/burn/receipt-upload-url', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /burn/receipt-upload-url', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /burn/receipt-upload-url',
    rawPath: '/burn/receipt-upload-url',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('burn/receipt-upload-url handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when contentType is missing', async () => {
        const result = await handler(mockEvent('user-123', {})) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 for unsupported content type', async () => {
        const result = await handler(mockEvent('user-123', { contentType: 'video/mp4' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when file is too large', async () => {
        const result = await handler(mockEvent('user-123', {
            contentType: 'image/jpeg', fileSize: 20 * 1024 * 1024,
        })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns presigned URL with scoped key', async () => {
        const result = await handler(mockEvent('user-123', { contentType: 'image/jpeg' })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.url).toBe('https://s3.example.com/presigned-put')
        expect(data.key).toMatch(/^receipts\/user-123\/.+\.jpg$/)
    })

    it('returns 500 when presigner throws', async () => {
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
        vi.mocked(getSignedUrl).mockRejectedValueOnce(new Error('S3 error'))

        const result = await handler(mockEvent('user-123', { contentType: 'image/jpeg' })) as any
        expect(result.statusCode).toBe(500)
    })
})
