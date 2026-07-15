import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string,
    pathParams: Record<string, string>,
    body: Record<string, unknown>
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub, email: 'test@cairn.local' },
                scopes: [],
            },
            principalId: '',
            integrationLatency: 0,
        },
        accountId: '',
        apiId: '',
        domainName: '',
        domainPrefix: '',
        http: {
            method: 'PUT',
            path: '/supplylines/supplyline-123',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'PUT /supplylines/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'PUT /supplylines/{id}',
    rawPath: '/supplylines/supplyline-123',
    rawQueryString: '',
    headers: {},
    pathParameters: pathParams,
    body: JSON.stringify(body),
    isBase64Encoded: false,
})

describe('supplylines/update handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates supplyline name and returns 200', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-123',
                name: 'Updated Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: []
            }
        })

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, { name: 'Updated Netflix' })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Updated Netflix')
    })

    it('updates multiple fields including markers', async () => {
        const mockMarkers = [
            { pk: 'USER#user-123', sk: 'MARKER#marker-1', name: 'Entertainment', color: '#FF0000' },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Responses: { 'cairn-test': mockMarkers } }) // BatchGetCommand for markers
            .mockResolvedValueOnce({
                Attributes: {
                    pk: 'USER#user-123',
                    sk: 'SUPPLYLINE#supplyline-123',
                    name: 'Netflix Premium',
                    amount: 19.99,
                    billingCycle: 'MONTHLY',
                    nextRenewal: '2026-07-01',
                    active: true,
                    markers: [{ id: 'marker-1', name: 'Entertainment', color: '#FF0000' }]
                }
            })

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, {
                name: 'Netflix Premium',
                amount: 19.99,
                nextRenewal: '2026-07-01',
                markerIds: ['marker-1']
            })
        ) as any

        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.name).toBe('Netflix Premium')
        expect(data.amount).toBe(19.99)
        expect(data.nextRenewal).toBe('2026-07-01')
        expect(data.markers).toHaveLength(1)
    })

    it('removes optional fields when set to empty', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-123',
                name: 'Netflix',
                amount: 15.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-06-01',
                active: true,
                markers: []
            }
        })

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, { url: '', notes: '' })
        ) as any

        expect(result.statusCode).toBe(200)
        const updateInput = vi.mocked(dynamo.send).mock.calls[0][0].input as {
            UpdateExpression: string
            ExpressionAttributeNames?: Record<string, string>
        }
        expect(updateInput.UpdateExpression).toContain('REMOVE #url, notes')
        expect(updateInput.ExpressionAttributeNames?.['#url']).toBe('url')
    })

    it('updates fundId alongside clearing a reserved keyword field', async () => {
        vi.mocked(dynamo.send).mockResolvedValueOnce({
            Attributes: {
                pk: 'USER#user-123',
                sk: 'SUPPLYLINE#supplyline-123',
                name: 'AppleCare One',
                amount: 12.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-08-01',
                active: true,
                fundId: 'fund-1',
                markers: []
            }
        })

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, {
                name: 'AppleCare One',
                amount: 12.99,
                billingCycle: 'MONTHLY',
                nextRenewal: '2026-08-01',
                url: null,
                notes: null,
                fundId: 'fund-1',
                active: true,
                markerIds: [],
            })
        ) as any

        expect(result.statusCode).toBe(200)
        const updateInput = vi.mocked(dynamo.send).mock.calls[0][0].input as {
            UpdateExpression: string
            ExpressionAttributeNames?: Record<string, string>
            ExpressionAttributeValues?: Record<string, unknown>
        }
        expect(updateInput.UpdateExpression).toContain('#url')
        expect(updateInput.UpdateExpression).toContain('fundId = :fundId')
        expect(updateInput.ExpressionAttributeNames?.['#url']).toBe('url')
        expect(updateInput.ExpressionAttributeValues?.[':fundId']).toBe('fund-1')
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(
            mockEvent('user-123', {}, { name: 'Updated Name' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing supplyline id')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 400 when no valid fields to update', async () => {
        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, { invalidField: 'value' })
        ) as any

        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('No valid fields to update')
        expect(dynamo.send).not.toHaveBeenCalled()
    })

    it('returns 500 when DynamoDB throws on BatchGetCommand', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, { markerIds: ['marker-1'] })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })

    it('returns 500 when DynamoDB throws on UpdateCommand', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(
            mockEvent('user-123', { id: 'supplyline-123' }, { name: 'Updated Name' })
        ) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})