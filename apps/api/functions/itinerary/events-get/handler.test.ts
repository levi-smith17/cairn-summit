import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

vi.mock('../../shared/itinerary-events', () => ({
    fetchUserItineraryEvents: vi.fn(),
}))

import { handler } from './handler'
import { fetchUserItineraryEvents } from '../../shared/itinerary-events'

const mockEvent = (qs = ''): APIGatewayProxyEventV2WithJWTAuthorizer => ({
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
            path: '/itinerary/events',
            protocol: 'HTTP/1.1',
            sourceIp: '',
            userAgent: '',
        },
        requestId: '',
        routeKey: 'GET /itinerary/events',
        stage: 'dev',
        time: '',
        timeEpoch: 0,
    },
    version: '2.0',
    routeKey: 'GET /itinerary/events',
    rawPath: '/itinerary/events',
    rawQueryString: qs,
    queryStringParameters: qs
        ? Object.fromEntries(new URLSearchParams(qs))
        : undefined,
    headers: {},
    isBase64Encoded: false,
})

describe('itinerary/events-get handler', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns external calendar events', async () => {
        vi.mocked(fetchUserItineraryEvents).mockResolvedValueOnce({
            events: [
                {
                    uid: 'evt-1',
                    title: 'Team standup',
                    startDate: '2026-05-30T14:00:00.000Z',
                    endDate: '2026-05-30T14:30:00.000Z',
                    allDay: false,
                    location: null,
                    notes: null,
                    color: '#007AFF',
                    readonly: true,
                    calendarId: 'cal-1',
                    url: 'https://caldav.icloud.com/cal/evt-1.ics',
                    recurrenceRule: null,
                },
            ],
            calendarSync: [],
        })

        const result = await handler(mockEvent()) as any
        const data = JSON.parse(result.body).data

        expect(result.statusCode).toBe(200)
        expect(data.events).toHaveLength(1)
        expect(data.events[0].title).toBe('Team standup')
        expect(fetchUserItineraryEvents).toHaveBeenCalledWith(
            'USER#user-123',
            undefined,
            undefined,
        )
    })

    it('passes from/to query params', async () => {
        vi.mocked(fetchUserItineraryEvents).mockResolvedValueOnce({ events: [], calendarSync: [] })

        await handler(mockEvent('from=2026-05-01&to=2026-05-31'))

        expect(fetchUserItineraryEvents).toHaveBeenCalledWith(
            'USER#user-123',
            new Date('2026-05-01'),
            new Date('2026-05-31'),
        )
    })
})
