import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn() },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (
    query?: string,
    deep?: string
): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        authorizer: {
            jwt: {
                claims: { sub: 'user-123', email: 'test@cairn.local' },
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
            path: '/search',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /search',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /search',
    rawPath: '/search',
    rawQueryString: '',
    headers: {},
    queryStringParameters: query ? { q: query, ...(deep ? { deep } : {}) } : undefined,
    isBase64Encoded: false,
})

describe('search/get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 400 when q is missing', async () => {
        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(400)
    })

    it('returns matching waypoints and markers', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [{ sk: 'WAYPOINT#wp1', title: 'React Docs', url: 'https://react.dev' }] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [{ sk: 'MARKER#m1', name: 'React', color: '#ff0000' }] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent('react')) as any
        const data = JSON.parse(result.body).data

        expect(data).toHaveLength(2)
        expect(data).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'waypoint', id: 'wp1', url: '/waypoints?id=wp1' }),
            expect.objectContaining({ type: 'marker', id: 'm1' }),
        ]))
    })

    it('searches log content only when deep=true', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [{ sk: 'LOG#l1', title: 'Notes', content: '<p>hidden keyword here</p>' }] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const shallow = await handler(mockEvent('keyword')) as any
        expect(JSON.parse(shallow.body).data).toHaveLength(0)

        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [{ sk: 'LOG#l1', title: 'Notes', content: '<p>hidden keyword here</p>' }] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const deep = await handler(mockEvent('keyword', 'true')) as any
        expect(JSON.parse(deep.body).data).toHaveLength(1)
    })
})
