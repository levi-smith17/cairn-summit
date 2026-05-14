import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (host?: string): APIGatewayProxyEventV2 => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/domain-lookup', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /domain-lookup', stage: 'dev', time: '', timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /domain-lookup',
    rawPath: '/domain-lookup',
    rawQueryString: '',
    headers: {},
    queryStringParameters: host ? { host } : undefined,
    isBase64Encoded: false,
})

describe('manifest/domain-lookup handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when host is missing', async () => {
        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns username when domain matches a profile', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [{ username: 'levismith' }] })

        const result = await handler(mockEvent('levismith.us')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.username).toBe('levismith')
    })

    it('returns null username when domain has no match', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('unknown.com')) as any
        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body).data.username).toBeNull()
    })

    it('sets Cache-Control header', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('test.com')) as any
        expect(result.headers['Cache-Control']).toContain('max-age=60')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))
        const result = await handler(mockEvent('test.com')) as any
        expect(result.statusCode).toBe(500)
    })
})
