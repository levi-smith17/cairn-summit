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
    id: string | undefined
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
            method: 'DELETE',
            path: `/trails/${id}`,
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'DELETE /trails/{id}',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'DELETE /trails/{id}',
    rawPath: `/trails/${id}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    isBase64Encoded: false,
})

describe('trails/delete handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 when id is missing', async () => {
        const result = await handler(mockEvent('user-123', undefined)) as any
        expect(result.statusCode).toBe(400)
        expect(JSON.parse(result.body).error).toBe('Missing trail id')
    })

    it('returns 204 on successful delete with no waypoints', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })  // GSI1 waypoints query
            .mockResolvedValueOnce({})              // trail delete

        const result = await handler(mockEvent('user-123', 'trail-abc')) as any
        expect(result.statusCode).toBe(204)
    })

    it('deletes the trail with the correct key', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({})

        await handler(mockEvent('user-123', 'trail-abc'))

        const calls = vi.mocked(dynamo.send).mock.calls
        const deleteCall = calls.find(c => c[0].input.Key?.sk === 'TRAIL#trail-abc')
        expect(deleteCall).toBeDefined()
        expect(deleteCall![0].input.Key).toEqual({ pk: 'USER#user-123', sk: 'TRAIL#trail-abc' })
    })

    it('unassigns waypoints that belong to the deleted trail via GSI1', async () => {
        const waypoints = [
            { pk: 'USER#user-123', sk: 'WAYPOINT#wp-1', gsi1pk: 'TRAIL#trail-abc', gsi1sk: 'WAYPOINT#wp-1' },
            { pk: 'USER#user-123', sk: 'WAYPOINT#wp-2', gsi1pk: 'TRAIL#trail-abc', gsi1sk: 'WAYPOINT#wp-2' },
        ]
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: waypoints })
            .mockResolvedValue({})

        await handler(mockEvent('user-123', 'trail-abc'))

        const calls = vi.mocked(dynamo.send).mock.calls
        const updateCalls = calls.filter(c => c[0].input.UpdateExpression === 'REMOVE trailId, gsi1pk, gsi1sk')
        expect(updateCalls).toHaveLength(2)
        const updatedKeys = updateCalls.map(c => c[0].input.Key.sk)
        expect(updatedKeys).toContain('WAYPOINT#wp-1')
        expect(updatedKeys).toContain('WAYPOINT#wp-2')
    })

    it('queries waypoints via GSI1 with correct trail key', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({})

        await handler(mockEvent('user-123', 'trail-abc'))

        const queryCall = vi.mocked(dynamo.send).mock.calls[0]
        expect(queryCall[0].input.IndexName).toBe('gsi1')
        expect(queryCall[0].input.ExpressionAttributeValues[':gsi1pk']).toBe('TRAIL#trail-abc')
        expect(queryCall[0].input.ExpressionAttributeValues[':prefix']).toBe('WAYPOINT#')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockImplementationOnce(() => Promise.reject(new Error('DynamoDB error')))

        const result = await handler(mockEvent('user-123', 'trail-abc')) as any
        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})