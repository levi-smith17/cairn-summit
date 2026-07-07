import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('@aws-sdk/client-ssm', () => ({
    SSMClient: vi.fn(function() { return { send: vi.fn().mockResolvedValue({}) } }),
    PutParameterCommand: vi.fn(),
}))

vi.mock('../../shared/caldav', () => ({
    resolveCalendarUrl: vi.fn().mockResolvedValue('https://caldav.icloud.com/u/123/calendars/work/'),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'
import { SSMClient } from '@aws-sdk/client-ssm'
import { resolveCalendarUrl } from '../../shared/caldav'

const mockEvent = (body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'POST', path: '/itinerary', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'POST /itinerary', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'POST /itinerary',
    rawPath: '/itinerary',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const validBody = { name: 'Work', appleId: 'levi@icloud.com', password: 'app-specific-password' }

describe('itinerary/create handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when required fields are missing', async () => {
        const result = await handler(mockEvent({ name: 'Work' })) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toContain('required')
    })

    it('returns 400 when the calendar name cannot be resolved', async () => {
        vi.mocked(resolveCalendarUrl).mockResolvedValueOnce(null)

        const result = await handler(mockEvent(validBody)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toContain('not found')
    })

    it('returns 201 with calendar id (no ssmPasswordPath)', async () => {
        vi.mocked(SSMClient).mockImplementation(function() { return { send: vi.fn().mockResolvedValue({}) } as any })

        const result = await handler(mockEvent(validBody)) as any
        expect(result.statusCode).toBe(201)
        const data = JSON.parse(result.body).data
        expect(data.id).toBeDefined()
        expect(data.name).toBe('Work')
        expect(data.calendarUrl).toBe('https://caldav.icloud.com/u/123/calendars/work/')
        expect(data.ssmPasswordPath).toBeUndefined()
    })

    it('stores password in SSM before writing to DynamoDB', async () => {
        const ssmSend = vi.fn().mockResolvedValue({})
        vi.mocked(SSMClient).mockImplementation(function() { return { send: ssmSend } as any })

        await handler(mockEvent(validBody))

        expect(ssmSend).toHaveBeenCalledOnce()
        const putCall = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(putCall.input.Item.appleId).toBe('levi@icloud.com')
        expect(putCall.input.Item.calendarUrl).toBe('https://caldav.icloud.com/u/123/calendars/work/')
        expect(putCall.input.Item.ssmPasswordPath).toMatch(/\/cairn\/users\/user-123\/itinerary\/.+\/password/)
        expect(putCall.input.Item.password).toBeUndefined()
    })

    it('uses defaults for serverUrl and color when not provided', async () => {
        vi.mocked(SSMClient).mockImplementation(function() { return { send: vi.fn().mockResolvedValue({}) } as any })

        await handler(mockEvent(validBody))

        const putCall = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(putCall.input.Item.serverUrl).toBe('https://caldav.icloud.com')
        expect(putCall.input.Item.color).toBe('#007AFF')
    })

    it('returns 500 when SSM throws', async () => {
        vi.mocked(SSMClient).mockImplementation(() => ({ send: vi.fn().mockRejectedValue(new Error('SSM error')) } as any))

        const result = await handler(mockEvent(validBody)) as any
        expect(result.statusCode).toBe(500)
    })
})
