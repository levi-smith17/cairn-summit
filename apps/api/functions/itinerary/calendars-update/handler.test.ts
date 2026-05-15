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

import { handler } from './handler'
import { dynamo } from '../../shared/db'
import { SSMClient } from '@aws-sdk/client-ssm'

const mockEvent = (id: string | undefined, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/itinerary/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /itinerary/{id}', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'PUT /itinerary/{id}',
    rawPath: `/itinerary/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

const existingCalendar = {
    pk: 'USER#user-123',
    sk: 'ITINERARY#cal-1',
    name: 'Work',
    appleId: 'levi@icloud.com',
    ssmPasswordPath: '/cairn/users/user-123/itinerary/cal-1/password',
    color: '#007AFF',
    syncEnabled: true,
}

describe('itinerary/update handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined, { name: 'Personal' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 when no valid fields provided', async () => {
        const result = await handler(mockEvent('cal-1', { unknownField: 'foo' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('updates calendar fields without touching SSM when no password provided', async () => {
        vi.mocked(SSMClient).mockImplementation(function() { return { send: vi.fn().mockResolvedValue({}) } as any })
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: { ...existingCalendar, name: 'Personal', ssmPasswordPath: existingCalendar.ssmPasswordPath }
        })

        const result = await handler(mockEvent('cal-1', { name: 'Personal' })) as any
        expect(result.statusCode).toBe(200)
        // Only one dynamo call (UpdateCommand) — no GetCommand needed without password
        expect(vi.mocked(dynamo.send).mock.calls).toHaveLength(1)
    })

    it('fetches existing item and updates SSM when password is provided', async () => {
        const ssmSend = vi.fn().mockResolvedValue({})
        vi.mocked(SSMClient).mockImplementation(function() { return { send: ssmSend } as any })
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: existingCalendar }) // GetCommand
            .mockResolvedValueOnce({ Attributes: { ...existingCalendar, name: 'Work' } }) // UpdateCommand

        await handler(mockEvent('cal-1', { name: 'Work', password: 'new-password' }))

        expect(ssmSend).toHaveBeenCalledOnce()
        expect(vi.mocked(dynamo.send).mock.calls).toHaveLength(2)
    })

    it('returns 404 when calendar does not exist and password update attempted', async () => {
        vi.mocked(SSMClient).mockImplementation(function() { return { send: vi.fn().mockResolvedValue({}) } as any })
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: undefined })

        const result = await handler(mockEvent('bad-id', { password: 'new-pass', name: 'X' })) as any
        expect(result.statusCode).toBe(404)
    })

    it('strips ssmPasswordPath from response', async () => {
        vi.mocked(SSMClient).mockImplementation(function() { return { send: vi.fn().mockResolvedValue({}) } as any })
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: { ...existingCalendar, ssmPasswordPath: '/secret/path' }
        })

        const result = await handler(mockEvent('cal-1', { color: '#FF0000' })) as any
        const data = JSON.parse(result.body).data
        expect(data.ssmPasswordPath).toBeUndefined()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(SSMClient).mockImplementation(function() { return { send: vi.fn().mockResolvedValue({}) } as any })
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('cal-1', { name: 'X' })) as any
        expect(result.statusCode).toBe(500)
    })
})
