import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

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

const mockEvent = (sub: string, key?: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: { claims: { sub, email: 'test@cairn.local' }, scopes: [] },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/logs/image-url', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /logs/image-url', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /logs/image-url',
    rawPath: '/logs/image-url',
    rawQueryString: '',
    headers: {},
    queryStringParameters: key ? { key } : undefined,
    isBase64Encoded: false,
})

describe('logs/image-url handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when key is missing', async () => {
        const result = await handler(mockEvent('user-123')) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 403 when key belongs to a different user', async () => {
        const result = await handler(mockEvent('user-123', 'logs/user-999/image.jpg')) as any
        expect(result.statusCode).toBe(403)
    })

    it('returns 302 redirect to presigned URL for valid key', async () => {
        const result = await handler(mockEvent('user-123', 'logs/user-123/image.jpg')) as any
        expect(result.statusCode).toBe(302)
        expect(result.headers['Location']).toBe('https://s3.example.com/presigned-get')
        expect(result.headers['Cache-Control']).toContain('private')
    })

    it('returns 500 when presigner throws', async () => {
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
        vi.mocked(getSignedUrl).mockRejectedValueOnce(new Error('S3 error'))

        const result = await handler(mockEvent('user-123', 'logs/user-123/image.jpg')) as any
        expect(result.statusCode).toBe(500)
    })
})
