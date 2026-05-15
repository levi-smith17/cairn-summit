import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
    CognitoIdentityProviderClient: vi.fn(function() { return { send: vi.fn().mockResolvedValue({}) } }),
    AdminDeleteUserCommand: vi.fn(),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

const mockEvent = (): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: '/account', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /account', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'DELETE /account',
    rawPath: '/account',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

const mockItems = [
    { pk: 'USER#user-123', sk: 'PROFILE' },
    { pk: 'USER#user-123', sk: 'SETTINGS' },
    { pk: 'USER#user-123', sk: 'WAYPOINT#wp-1' },
]

describe('settings/delete-account handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 204 and deletes all user items and Cognito user', async () => {
        const cognitoSend = vi.fn().mockResolvedValue({})
        vi.mocked(CognitoIdentityProviderClient).mockImplementation(function() { return { send: cognitoSend } as any })

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: mockItems, LastEvaluatedKey: undefined })
            .mockResolvedValueOnce({}) // BatchWrite

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(204)
        expect(cognitoSend).toHaveBeenCalledOnce()
    })

    it('returns 204 when user has no items', async () => {
        const cognitoSend = vi.fn().mockResolvedValue({})
        vi.mocked(CognitoIdentityProviderClient).mockImplementation(function() { return { send: cognitoSend } as any })

        vi.mocked(dynamo.send).mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined })

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(204)
        expect(cognitoSend).toHaveBeenCalledOnce()
    })

    it('paginates through all items before deleting', async () => {
        const cognitoSend = vi.fn().mockResolvedValue({})
        vi.mocked(CognitoIdentityProviderClient).mockImplementation(function() { return { send: cognitoSend } as any })

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: mockItems.slice(0, 2), LastEvaluatedKey: { pk: 'USER#user-123', sk: 'SETTINGS' } })
            .mockResolvedValueOnce({ Items: mockItems.slice(2), LastEvaluatedKey: undefined })
            .mockResolvedValueOnce({}) // BatchWrite

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(204)
        // 2 queries + 1 batch delete
        expect(vi.mocked(dynamo.send).mock.calls).toHaveLength(3)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(500)
    })
})
