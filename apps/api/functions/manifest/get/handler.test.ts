import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    sub: string
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
            method: 'GET',
            path: '/manifest',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /manifest',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /manifest',
    rawPath: '/manifest',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

describe('manifest/get handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns manifest aggregates with ids', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { pk: 'USER#user-123', sk: 'PROFILE', name: 'Levi' } })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'EXPEDITION#e1', title: 'Trip' }] })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'TRAINING#t1', institution: 'School' }] })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'GEAR#g1', name: 'Boots' }] })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'LANDMARK#l1', name: 'Project' }] })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'SUMMIT#s1', title: 'Award' }] })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'PATHFINDING#p1', organization: 'Org' }] })
            .mockResolvedValueOnce({ Items: [{ pk: 'USER#user-123', sk: 'COMPANION#c1', name: 'Buddy' }] })

        const result = await handler(mockEvent('user-123')) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data.expeditions[0].id).toBe('e1')
        expect(data.training[0].id).toBe('t1')
        expect(data.gear[0].id).toBe('g1')
        expect(data.landmarks[0].id).toBe('l1')
        expect(data.summits[0].id).toBe('s1')
        expect(data.pathfinding[0].id).toBe('p1')
        expect(data.companions[0].id).toBe('c1')
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent('user-123')) as any

        expect(result.statusCode).toBe(500)
        expect(JSON.parse(result.body).error).toBe('Internal server error')
    })
})
