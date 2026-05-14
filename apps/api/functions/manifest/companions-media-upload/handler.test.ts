import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))
vi.mock('../../shared/s3', () => ({
    s3: {},
    PUBLIC_MEDIA_BUCKET: 'cairn-test-public-media',
    PRESIGN_EXPIRES: 3600,
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-put'),
}))
vi.mock('@aws-sdk/client-s3', () => ({ PutObjectCommand: vi.fn() }))

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
        http: { method: 'POST', path: '/companions/upload-url', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /companions/upload-url', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'POST /companions/upload-url',
    rawPath: '/companions/upload-url',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('companions/upload-url handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when companionId is missing', async () => {
        const result = await handler(mockEvent('user-123', { contentType: 'image/jpeg' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when contentType is missing', async () => {
        const result = await handler(mockEvent('user-123', { companionId: 'comp-1' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 for unsupported content type', async () => {
        const result = await handler(mockEvent('user-123', {
            companionId: 'comp-1', contentType: 'application/pdf',
        })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when file is too large', async () => {
        const result = await handler(mockEvent('user-123', {
            companionId: 'comp-1', contentType: 'image/jpeg', fileSize: 200 * 1024 * 1024,
        })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 404 when companion does not belong to user', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })

        const result = await handler(mockEvent('user-123', {
            companionId: 'comp-1', contentType: 'image/jpeg',
        })) as any
        expect(result.statusCode).toBe(404)
    })

    it('returns presigned URL and records media in DynamoDB', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { pk: 'USER#user-123', sk: 'COMPANION#comp-1' } })
            .mockResolvedValueOnce({}) // UpdateCommand

        const result = await handler(mockEvent('user-123', {
            companionId: 'comp-1', contentType: 'image/jpeg', order: 0,
        })) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.url).toBe('https://s3.example.com/presigned-put')
        expect(data.key).toMatch(/^companions\/user-123\/.+\.jpg$/)
        expect(data.type).toBe('IMAGE')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('user-123', {
            companionId: 'comp-1', contentType: 'image/jpeg',
        })) as any
        expect(result.statusCode).toBe(500)
    })
})
