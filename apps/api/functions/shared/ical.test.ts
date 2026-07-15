import { describe, it, expect } from 'vitest'
import { parseICSEvents } from './ical'

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-uid-1
SUMMARY:All-day hike
DTSTART;VALUE=DATE:20260530
DTEND;VALUE=DATE:20260531
END:VEVENT
BEGIN:VEVENT
UID:test-uid-2
SUMMARY:Afternoon meeting
DTSTART:20260530T150000Z
DTEND:20260530T160000Z
LOCATION:Trailhead
END:VEVENT
END:VCALENDAR`

describe('parseICSEvents', () => {
    it('parses all-day and timed events', () => {
        const from = new Date('2026-05-01')
        const to = new Date('2026-06-01')
        const events = parseICSEvents(SAMPLE_ICS, 'https://example.com/cal.ics', from, to)

        expect(events).toHaveLength(2)
        expect(events[0].title).toBe('All-day hike')
        expect(events[0].allDay).toBe(true)
        expect(events[1].title).toBe('Afternoon meeting')
        expect(events[1].location).toBe('Trailhead')
    })

    it('filters events outside the window', () => {
        const from = new Date('2026-07-01')
        const to = new Date('2026-08-01')
        const events = parseICSEvents(SAMPLE_ICS, 'https://example.com/cal.ics', from, to)
        expect(events).toHaveLength(0)
    })

    it('parses TZID local times into correct UTC instants', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:tz-test
SUMMARY:Morning appointment
DTSTART;TZID=America/New_York:20260707T101500
DTEND;TZID=America/New_York:20260707T111500
END:VEVENT
END:VCALENDAR`

        const events = parseICSEvents(
            ics,
            'https://example.com/cal.ics',
            new Date('2026-07-01'),
            new Date('2026-08-01'),
        )

        expect(events).toHaveLength(1)
        expect(events[0].startDate.toISOString()).toBe('2026-07-07T14:15:00.000Z')
        expect(events[0].endDate?.toISOString()).toBe('2026-07-07T15:15:00.000Z')
    })

    it('resolves Windows and GMT offset TZIDs without failing the feed', () => {
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:win-tz
SUMMARY:Outlook meeting
DTSTART;TZID=Eastern Standard Time:20260707T101500
DTEND;TZID=Eastern Standard Time:20260707T111500
END:VEVENT
BEGIN:VEVENT
UID:gmt-tz
SUMMARY:Offset meeting
DTSTART;TZID=GMT-0400:20260707T101500
DTEND;TZID=GMT-0400:20260707T111500
END:VEVENT
BEGIN:VEVENT
UID:quoted-tz
SUMMARY:Quoted Outlook zone
DTSTART;TZID="Eastern Standard Time":20260708T090000
DTEND;TZID="Eastern Standard Time":20260708T100000
END:VEVENT
END:VCALENDAR`

        const events = parseICSEvents(
            ics,
            'https://example.com/cal.ics',
            new Date('2026-07-01'),
            new Date('2026-08-01'),
        )

        expect(events).toHaveLength(3)
        expect(events[0].startDate.toISOString()).toBe('2026-07-07T14:15:00.000Z')
        expect(events[1].startDate.toISOString()).toBe('2026-07-07T14:15:00.000Z')
        expect(events[2].startDate.toISOString()).toBe('2026-07-08T13:00:00.000Z')
    })
})
