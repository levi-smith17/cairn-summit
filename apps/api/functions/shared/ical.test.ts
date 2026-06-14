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
})
