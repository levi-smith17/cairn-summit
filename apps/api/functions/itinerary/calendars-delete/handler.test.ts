import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('@aws-sdk/client-ssm', () => ({
    SSMClient: vi.fn(function() { return { send: vi.fn().mockResolvedValue({}) } }),
    DeleteParameterCommand: vi.fn(),
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'
import { SSMClient } from '@aws-sdk/client-ssm'

const mockEvent = (id: string | undefined): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'DELETE', path: `/itinerary/${id}`, protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'DELETE /itinerary/{id}', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'DELETE /itinerary/{id}',
    rawPath: `/itinerary/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

const existingCalendar = {
    pk: 'USER#user-123',
    sk: 'ITINERARY#cal-1',
    ssmPasswordPath: '/cairn/users/user-123/itinerary/cal-1/password',
}

describe('itinerary/delete handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent(undefined)) as any
        expect(result.statusCode).toBe(400)
    })

    it('deletes SSM parameter and DynamoDB item', async () => {
        const ssmSend = vi.fn().mockResolvedValue({})
        vi.mocked(SSMClient).mockImplementation(function() { return { send: ssmSend } as any })
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: existingCalendar }) // GetCommand
            .mockResolvedValueOnce({})                         // DeleteCommand

        const result = await handler(mockEvent('cal-1')) as any
        expect(result.statusCode).toBe(204)
        expect(ssmSend).toHaveBeenCalledOnce()
    })

    it('still deletes DynamoDB item if calendar has no ssmPasswordPath', async () => {
        const ssmSend = vi.fn().mockResolvedValue({})
        vi.mocked(SSMClient).mockImplementation(function() { return { send: ssmSend } as any })
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { pk: 'USER#user-123', sk: 'ITINERARY#cal-1' } })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('cal-1')) as any
        expect(result.statusCode).toBe(204)
        expect(ssmSend).not.toHaveBeenCalled()
    })

    it('still deletes DynamoDB item even if SSM delete fails', async () => {
        const ssmSend = vi.fn().mockRejectedValue(new Error('SSM error'))
        vi.mocked(SSMClient).mockImplementation(function() { return { send: ssmSend } as any })
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: existingCalendar })
            .mockResolvedValueOnce({})

        const result = await handler(mockEvent('cal-1')) as any
        expect(result.statusCode).toBe(204)
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(SSMClient).mockImplementation(() => ({ send: vi.fn().mockResolvedValue({}) } as any))
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('cal-1')) as any
        expect(result.statusCode).toBe(500)
    })
})
