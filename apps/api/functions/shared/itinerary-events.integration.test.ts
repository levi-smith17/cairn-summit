import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./db', async () => {
    const { getSharedMemoryDynamo } = await import('./test/memory-dynamo')
    return {
        dynamo: getSharedMemoryDynamo(),
        TABLE_NAME: 'cairn-test',
    }
})

vi.mock('./caldav', () => ({
    fetchCalDavEvents: vi.fn(),
}))

vi.mock('./ical', () => ({
    fetchSubscriptionEvents: vi.fn(),
}))

vi.mock('@aws-sdk/client-ssm', () => {
    class MockSSMClient {
        send = vi.fn().mockResolvedValue({ Parameter: { Value: 'app-password' } })
    }
    return {
        SSMClient: MockSSMClient,
        GetParameterCommand: vi.fn(),
    }
})

import { getSharedMemoryDynamo } from './test/memory-dynamo'
import { fetchUserItineraryEvents } from './itinerary-events'
import { fetchCalDavEvents } from './caldav'
import { fetchSubscriptionEvents } from './ical'

const memory = getSharedMemoryDynamo()
const USER_PK = 'USER#user-123'

describe('fetchUserItineraryEvents (integration)', () => {
    beforeEach(() => {
        memory.reset()
        vi.clearAllMocks()
        memory.seed([
            {
                pk: USER_PK,
                sk: 'ITINERARY#cal-1',
                name: 'Personal',
                color: '#007AFF',
                appleId: 'levi@icloud.com',
                serverUrl: 'https://caldav.icloud.com',
                syncEnabled: true,
                ssmPasswordPath: '/cairn/users/user-123/itinerary/cal-1/password',
                calendarUrl: 'https://caldav.icloud.com/u/123/calendars/personal/',
            },
            {
                pk: USER_PK,
                sk: 'ITINERARY_SUB#sub-1',
                name: 'Holidays',
                url: 'https://example.com/holidays.ics',
                color: '#FF9500',
                syncEnabled: true,
            },
        ])
    })

    it('merges CalDAV and ICS subscription events', async () => {
        vi.mocked(fetchCalDavEvents).mockResolvedValueOnce([
            {
                uid: 'caldav-1',
                title: 'Morning hike',
                startDate: new Date('2026-05-30T10:00:00.000Z'),
                endDate: new Date('2026-05-30T12:00:00.000Z'),
                allDay: false,
                location: 'Summit trail',
                notes: null,
                url: 'https://caldav.icloud.com/event/1',
                recurrenceRule: null,
            },
        ])
        vi.mocked(fetchSubscriptionEvents).mockResolvedValueOnce([
            {
                uid: 'ics-1',
                title: 'Memorial Day',
                startDate: new Date('2026-05-25T00:00:00.000Z'),
                endDate: new Date('2026-05-26T00:00:00.000Z'),
                allDay: true,
                location: null,
                notes: null,
                url: 'https://example.com/holidays.ics',
                recurrenceRule: null,
            },
        ])

        const result = await fetchUserItineraryEvents(
            USER_PK,
            new Date('2026-05-01'),
            new Date('2026-06-01'),
        )

        expect(result.events).toHaveLength(2)
        expect(result.events[0].title).toBe('Memorial Day')
        expect(result.events[0].calendarId).toBe('sub-1')
        expect(result.events[0].readonly).toBe(true)
        expect(result.events[1].title).toBe('Morning hike')
        expect(result.events[1].calendarId).toBe('cal-1')
        expect(result.events[1].color).toBe('#007AFF')
        expect(result.calendarSync).toHaveLength(2)
        expect(fetchCalDavEvents).toHaveBeenCalledOnce()
        expect(fetchSubscriptionEvents).toHaveBeenCalledOnce()
    })

    it('skips calendars with sync disabled', async () => {
        memory.reset()
        memory.seed([
            {
                pk: USER_PK,
                sk: 'ITINERARY#cal-off',
                name: 'Disabled',
                color: '#000',
                appleId: 'levi@icloud.com',
                serverUrl: 'https://caldav.icloud.com',
                syncEnabled: false,
                ssmPasswordPath: '/cairn/password',
            },
        ])

        const result = await fetchUserItineraryEvents(USER_PK)
        expect(result.events).toHaveLength(0)
        expect(result.calendarSync).toHaveLength(0)
        expect(fetchCalDavEvents).not.toHaveBeenCalled()
        expect(fetchSubscriptionEvents).not.toHaveBeenCalled()
    })
})
