import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (section: string | undefined, body: object): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'PUT', path: `/settings/${section}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'PUT /settings/{section}', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'PUT /settings/{section}',
    rawPath: `/settings/${section}`,
    rawQueryString: '',
    headers: {},
    pathParameters: section ? { section } : undefined,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('settings/update handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when section is missing', async () => {
        const result = await handler(mockEvent(undefined, {})) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns 400 for invalid section', async () => {
        const result = await handler(mockEvent('unknown', {})) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toMatch(/Invalid section/)
    })

    it('updates account fields on PROFILE item', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: { pk: 'USER#user-123', sk: 'PROFILE', timeFormat: 'TWENTYFOUR', listed: true }
        })

        const result = await handler(mockEvent('account', { timeFormat: 'TWENTYFOUR', listed: true })) as any
        expect(result.statusCode).toBe(200)

        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(call.input.Key.sk).toBe('PROFILE')
        expect(call.input.ExpressionAttributeValues[':timeFormat']).toBe('TWENTYFOUR')
    })

    it('returns 400 for account update with no valid fields', async () => {
        const result = await handler(mockEvent('account', { unknownField: 'foo' })) as any
        expect(result.statusCode).toBe(400)
    })

    it('removes nullable account fields when sent as null', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { pk: 'USER#user-123', sk: 'PROFILE' } })

        const result = await handler(mockEvent('account', { username: null, customDomain: null })) as any
        expect(result.statusCode).toBe(200)

        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(call.input.UpdateExpression).toContain('REMOVE')
        expect(call.input.UpdateExpression).not.toContain('SET')
        expect(call.input.ExpressionAttributeNames['#username']).toBe('username')
        expect(call.input.ExpressionAttributeNames['#customDomain']).toBe('customDomain')
    })

    it('handles mix of set and remove in account update', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { pk: 'USER#user-123', sk: 'PROFILE', listed: true } })

        const result = await handler(mockEvent('account', { listed: true, customDomain: null })) as any
        expect(result.statusCode).toBe(200)

        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(call.input.UpdateExpression).toContain('SET')
        expect(call.input.UpdateExpression).toContain('REMOVE')
    })

    it('updates appearance section on SETTINGS item', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: { pk: 'USER#user-123', sk: 'SETTINGS', appearance: { sidebarDefault: 'COLLAPSED', defaultLandingPage: '/logs', dateFormat: 'MDY' } }
        })

        const payload = { sidebarDefault: 'COLLAPSED', defaultLandingPage: '/logs', dateFormat: 'MDY' }
        const result = await handler(mockEvent('appearance', payload)) as any
        expect(result.statusCode).toBe(200)

        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(call.input.Key.sk).toBe('SETTINGS')
        expect(call.input.ExpressionAttributeNames['#section']).toBe('appearance')
        expect(call.input.ExpressionAttributeValues[':data']).toEqual(payload)
    })

    it('updates signals section', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({ Attributes: { signals: { messagesPerPage: 50 } } })

        const result = await handler(mockEvent('signals', { messagesPerPage: 50, autoMarkRead: false })) as any
        expect(result.statusCode).toBe(200)

        const call = vi.mocked(dynamo.send).mock.calls[0][0]
        expect(call.input.ExpressionAttributeNames['#section']).toBe('signals')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('appearance', { sidebarDefault: 'COLLAPSED' })) as any
        expect(result.statusCode).toBe(500)
    })
})
