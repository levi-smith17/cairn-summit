import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('tsdav', () => ({
    createDAVClient: vi.fn(),
}))

import { createDAVClient } from 'tsdav'
import {
    fetchCalDavEvents,
    fetchCalDavEventsByUrl,
    listICloudCalendarNames,
    resolveCalendarUrl,
} from './caldav'

describe('caldav (tsdav)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('resolveCalendarUrl matches display names case-insensitively', async () => {
        vi.mocked(createDAVClient).mockResolvedValue({
            fetchCalendars: vi.fn().mockResolvedValue([
                {
                    url: 'https://caldav.icloud.com/u/123/calendars/home/',
                    displayName: 'Home',
                    components: ['VEVENT'],
                },
                {
                    url: 'https://caldav.icloud.com/u/123/calendars/work/',
                    displayName: 'Work',
                    components: ['VEVENT'],
                },
            ]),
        } as never)

        await expect(
            resolveCalendarUrl(
                'https://caldav.icloud.com',
                'user@icloud.com',
                'password',
                'home',
            ),
        ).resolves.toBe('https://caldav.icloud.com/u/123/calendars/home/')
    })

    it('fetchCalDavEvents uses a stored calendar URL without re-resolving by name', async () => {
        const fetchCalendarObjects = vi.fn().mockResolvedValue([
            {
                url: 'https://caldav.icloud.com/u/123/calendars/home/event.ics',
                data: [
                    'BEGIN:VCALENDAR',
                    'BEGIN:VEVENT',
                    'UID:evt-1',
                    'SUMMARY:Standup',
                    'DTSTART:20260707T140000Z',
                    'DTEND:20260707T143000Z',
                    'END:VEVENT',
                    'END:VCALENDAR',
                ].join('\r\n'),
            },
        ])
        vi.mocked(createDAVClient).mockResolvedValue({
            fetchCalendars: vi.fn(),
            fetchCalendarObjects,
        } as never)

        const from = new Date('2026-07-01T00:00:00.000Z')
        const to = new Date('2026-07-31T23:59:59.999Z')
        const events = await fetchCalDavEvents(
            'https://caldav.icloud.com',
            'user@icloud.com',
            'password',
            'Wrong Name',
            from,
            to,
            'https://caldav.icloud.com/u/123/calendars/home/',
        )

        expect(events).toHaveLength(1)
        expect(events[0]?.title).toBe('Standup')
        expect(fetchCalendarObjects).toHaveBeenCalledOnce()
    })

    it('listICloudCalendarNames returns VEVENT calendars only', async () => {
        vi.mocked(createDAVClient).mockResolvedValue({
            fetchCalendars: vi.fn().mockResolvedValue([
                { displayName: 'Home', components: ['VEVENT'] },
                { displayName: 'Reminders', components: ['VTODO'] },
            ]),
        } as never)

        await expect(
            listICloudCalendarNames('https://caldav.icloud.com', 'user@icloud.com', 'password'),
        ).resolves.toEqual(['Home'])
    })

    it('fetchCalDavEventsByUrl parses returned ICS blocks', async () => {
        vi.mocked(createDAVClient).mockResolvedValue({
            fetchCalendarObjects: vi.fn().mockResolvedValue([
                {
                    url: 'https://caldav.icloud.com/u/123/calendars/home/event.ics',
                    data: [
                        'BEGIN:VCALENDAR',
                        'BEGIN:VEVENT',
                        'UID:evt-2',
                        'SUMMARY:Lunch',
                        'DTSTART:20260707T120000Z',
                        'DTEND:20260707T130000Z',
                        'END:VEVENT',
                        'END:VCALENDAR',
                    ].join('\r\n'),
                },
            ]),
        } as never)

        const from = new Date('2026-07-01T00:00:00.000Z')
        const to = new Date('2026-07-31T23:59:59.999Z')
        const events = await fetchCalDavEventsByUrl(
            'https://caldav.icloud.com',
            'user@icloud.com',
            'password',
            'https://caldav.icloud.com/u/123/calendars/home/',
            from,
            to,
        )

        expect(events).toHaveLength(1)
        expect(events[0]?.title).toBe('Lunch')
    })
})
