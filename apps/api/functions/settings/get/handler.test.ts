import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

import { handler } from './handler'
import { dynamo } from '../../shared/db'

const mockEvent = (): APIGatewayProxyEventV2WithJWTAuthorizer => ({
    requestContext: {
        accountId: '', apiId: '', domainName: '', domainPrefix: '',
        http: { method: 'GET', path: '/settings', protocol: 'HTTP/1.1', sourceIp: '', userAgent: '' },
        requestId: '', routeKey: 'GET /settings', stage: 'dev', time: '', timeEpoch: 0,
        authorizer: { jwt: { claims: { sub: 'user-123' }, scopes: [] } },
    },
    version: '2.0',
    routeKey: 'GET /settings',
    rawPath: '/settings',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
})

const mockProfile = {
    pk: 'USER#user-123',
    sk: 'PROFILE',
    name: 'Levi Smith',
    email: 'levi@example.com',
    image: null,
    username: 'levi',
    timeFormat: 'TWELVE',
    listed: true,
}

const mockSettings = {
    pk: 'USER#user-123',
    sk: 'SETTINGS',
    appearance: { sidebarDefault: 'COLLAPSED', defaultLandingPage: '/logs', dateFormat: 'DMY' },
}

const mockCalendars = [
    { pk: 'USER#user-123', sk: 'ITINERARY#cal-1', name: 'Work', appleId: 'levi@icloud.com', ssmPasswordPath: '/cairn/users/user-123/itinerary/cal-1/password', color: '#FF0000', syncEnabled: true, serverUrl: 'https://caldav.icloud.com', createdAt: '2026-01-01T00:00:00.000Z' },
]

const mockSubscriptions = [
    { pk: 'USER#user-123', sk: 'ITINERARY_SUB#sub-1', name: 'Holidays', url: 'https://example.com/holidays.ics', color: '#34C759', syncEnabled: true, createdAt: '2026-01-01T00:00:00.000Z' },
]

describe('settings/get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns merged profile, settings, itinerary, and subscriptions', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockProfile })       // profile
            .mockResolvedValueOnce({ Item: mockSettings })      // settings
            .mockResolvedValueOnce({ Items: mockCalendars })    // itinerary
            .mockResolvedValueOnce({ Items: mockSubscriptions }) // subscriptions

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(200)
        const data = JSON.parse(result.body).data
        expect(data.account.name).toBe('Levi Smith')
        expect(data.account.email).toBe('levi@example.com')
        expect(data.account.username).toBe('levi')
        expect(data.appearance.sidebarDefault).toBe('COLLAPSED')
        expect(data.calendars).toHaveLength(1)
        expect(data.calendars[0].id).toBe('cal-1')
        expect(data.calendarSubscriptions).toHaveLength(1)
        expect(data.calendarSubscriptions[0].id).toBe('sub-1')
    })

    it('strips ssmPasswordPath from returned itinerary', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockProfile })
            .mockResolvedValueOnce({ Item: mockSettings })
            .mockResolvedValueOnce({ Items: mockCalendars })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data
        expect(data.calendars[0].ssmPasswordPath).toBeUndefined()
    })

    it('returns defaults when no SETTINGS item exists', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: mockProfile })
            .mockResolvedValueOnce({ Item: undefined })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data
        expect(data.appearance.sidebarDefault).toBe('EXPANDED')
        expect(data.calendars).toHaveLength(0)
        expect(data.calendarSubscriptions).toHaveLength(0)
    })

    it('returns null for missing account fields', async () => {
        vi.mocked(dynamo.send)
            .mockResolvedValueOnce({ Item: { pk: 'USER#user-123', sk: 'PROFILE' } })
            .mockResolvedValueOnce({ Item: undefined })
            .mockResolvedValueOnce({ Items: [] })
            .mockResolvedValueOnce({ Items: [] })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data
        expect(data.account.name).toBeNull()
        expect(data.account.email).toBeNull()
        expect(data.account.image).toBeNull()
    })

    it('returns 500 when DynamoDB throws', async () => {
        vi.mocked(dynamo.send).mockRejectedValueOnce(new Error('DynamoDB error'))

        const result = await handler(mockEvent()) as any
        expect(result.statusCode).toBe(500)
    })
})
