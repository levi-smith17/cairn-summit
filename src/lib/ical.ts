import { createDAVClient } from 'tsdav'
import { randomUUID } from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ICalEvent {
  uid: string
  url: string
  title: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  notes: string | null
  location: string | null
  recurrenceRule: string | null
}

// ─── ICS parsing ─────────────────────────────────────────────────────────────

function parseICSDate(value: string): { date: Date; allDay: boolean } {
  // All-day: VALUE=DATE:20260402
  if (/^\d{8}$/.test(value)) {
    const y = parseInt(value.slice(0, 4))
    const m = parseInt(value.slice(4, 6)) - 1
    const d = parseInt(value.slice(6, 8))
    return { date: new Date(y, m, d), allDay: true }
  }
  // UTC: 20260402T100000Z
  if (value.endsWith('Z')) {
    return { date: new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')), allDay: false }
  }
  // Local (with TZID stripped): 20260402T100000
  const m = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (m) {
    return { date: new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]), allDay: false }
  }
  return { date: new Date(value), allDay: false }
}

function extractICSValue(ics: string, key: string): string | null {
  // Match "KEY:" or "KEY;...:" at start of line (handles parameters like TZID)
  const re = new RegExp(`^${key}(?:;[^:]*)?:(.+)$`, 'm')
  const match = ics.match(re)
  return match ? match[1].replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() : null
}

function extractVEvents(icsString: string): string[] {
  const events: string[] = []
  const re = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g
  let match
  while ((match = re.exec(icsString)) !== null) {
    events.push(match[0])
  }
  return events
}

// ─── RRULE expansion ─────────────────────────────────────────────────────────

function parseRRule(rrule: string): Record<string, string> {
  const parts: Record<string, string> = {}
  rrule.split(';').forEach(p => {
    const idx = p.indexOf('=')
    if (idx !== -1) parts[p.slice(0, idx)] = p.slice(idx + 1)
  })
  return parts
}

function expandRRule(
  base: ICalEvent,
  rrule: string,
  exDates: Set<string>,
  from: Date,
  to: Date,
): ICalEvent[] {
  const rule = parseRRule(rrule)
  const freq     = rule.FREQ
  const interval = parseInt(rule.INTERVAL ?? '1', 10)
  const count    = rule.COUNT ? parseInt(rule.COUNT, 10) : Infinity
  const until    = rule.UNTIL ? parseICSDate(rule.UNTIL).date : null
  const byDay    = rule.BYDAY ? rule.BYDAY.split(',') : null

  // Day-of-week map for BYDAY
  const DOW: Record<string, number> = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 }

  const duration = base.endDate ? base.endDate.getTime() - base.startDate.getTime() : 0
  const endLimit = until && until < to ? until : to

  const results: ICalEvent[] = []
  let current = new Date(base.startDate)
  let n = 0

  // Safety: don't loop more than 2000 iterations
  while (current <= endLimit && n < count && n < 2000) {
    const dateKey = current.toISOString().slice(0, 10)
    const inWindow = current >= from && current <= to
    const notExcluded = !exDates.has(dateKey)

    if (inWindow && notExcluded) {
      results.push({
        ...base,
        uid:       `${base.uid}:${current.toISOString()}`,
        startDate: new Date(current),
        endDate:   duration > 0 ? new Date(current.getTime() + duration) : null,
      })
    }

    // Advance to next candidate
    const next = new Date(current)
    switch (freq) {
      case 'DAILY':
        next.setDate(next.getDate() + interval)
        break
      case 'WEEKLY':
        if (byDay && byDay.length > 1) {
          // Multiple BYDAY: advance one day at a time, only count full week intervals
          next.setDate(next.getDate() + 1)
          // Find next matching day in the same or next week group
          let found = false
          for (let i = 0; i < 7 * interval; i++) {
            const dayAbbr = Object.keys(DOW).find(k => DOW[k] === next.getDay())
            if (dayAbbr && byDay.some(d => d.endsWith(dayAbbr))) { found = true; break }
            next.setDate(next.getDate() + 1)
          }
          if (!found) break
        } else {
          next.setDate(next.getDate() + 7 * interval)
        }
        break
      case 'MONTHLY':
        next.setMonth(next.getMonth() + interval)
        break
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + interval)
        break
      default:
        // Unknown freq — emit base event only and stop
        return results
    }
    current = next
    n++
  }

  return results
}

export function parseICSEvents(icsString: string, url: string, from?: Date, to?: Date): ICalEvent[] {
  const windowFrom = from ?? new Date(0)
  const windowTo   = to   ?? new Date(8_640_000_000_000_000) // max date

  // Collect RECURRENCE-ID overrides (keyed by uid:date) to de-duplicate
  const overrides = new Set<string>()

  const vevents = extractVEvents(icsString)

  // First pass: collect all RECURRENCE-ID values so we can skip them in the master
  for (const vevent of vevents) {
    const uid = extractICSValue(vevent, 'UID')
    const recId = extractICSValue(vevent, 'RECURRENCE-ID')
    if (uid && recId) {
      const parsed = parseICSDate(recId)
      overrides.add(`${uid}:${parsed.date.toISOString().slice(0, 10)}`)
    }
  }

  return vevents.flatMap(vevent => {
    const uid         = extractICSValue(vevent, 'UID')
    const summary     = extractICSValue(vevent, 'SUMMARY')
    const dtstart     = extractICSValue(vevent, 'DTSTART')
    const dtend       = extractICSValue(vevent, 'DTEND')
    const description = extractICSValue(vevent, 'DESCRIPTION')
    const location    = extractICSValue(vevent, 'LOCATION')
    const rrule       = extractICSValue(vevent, 'RRULE')
    const recId       = extractICSValue(vevent, 'RECURRENCE-ID')

    if (!uid || !dtstart) return []

    const start = parseICSDate(dtstart)
    const end   = dtend ? parseICSDate(dtend) : null

    // ICS DTEND for all-day events is EXCLUSIVE (the day after the last day).
    // Convert to inclusive so calendar views don't show the event on the boundary day.
    let endDate = end?.date ?? null
    if (start.allDay && endDate) {
      const adj = new Date(endDate)
      adj.setDate(adj.getDate() - 1)
      endDate = adj
    }

    const base: ICalEvent = {
      uid,
      url,
      title:          summary ?? '(No title)',
      startDate:      start.date,
      endDate,
      allDay:         start.allDay,
      notes:          description,
      location:       location,
      recurrenceRule: rrule ?? null,
    }

    // Exception instance (RECURRENCE-ID) — emit as-is if in window
    if (recId) {
      return start.date >= windowFrom && start.date <= windowTo ? [base] : []
    }

    // Recurring master event — expand occurrences
    if (rrule) {
      // Collect EXDATE values for this UID
      const exDates = new Set<string>()
      const exDateRaw = extractICSValue(vevent, 'EXDATE')
      if (exDateRaw) {
        exDateRaw.split(',').forEach(v => {
          const d = parseICSDate(v.trim())
          exDates.add(d.date.toISOString().slice(0, 10))
        })
      }
      return expandRRule(base, rrule, exDates, windowFrom, windowTo)
        // Drop any occurrence already covered by a RECURRENCE-ID override
        .filter(e => !overrides.has(`${uid}:${e.startDate.toISOString().slice(0, 10)}`))
    }

    // Plain single event
    return start.date >= windowFrom && start.date <= windowTo ? [base] : []
  })
}

// ─── ICS generation ──────────────────────────────────────────────────────────

function formatICSDate(date: Date, allDay: boolean): string {
  if (allDay) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateICS(params: {
  uid: string
  title: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  notes?: string | null
  location?: string | null
  recurrenceRule?: string | null
  recurrenceId?: Date | null   // if set, emits RECURRENCE-ID (exception instance)
}): string {
  const now = formatICSDate(new Date(), false)
  const dtstart = params.allDay
    ? `DTSTART;VALUE=DATE:${formatICSDate(params.startDate, true)}`
    : `DTSTART:${formatICSDate(params.startDate, false)}`

  // For all-day events, ICS DTEND is EXCLUSIVE (next day after the last day).
  // We store endDate as inclusive, so add 1 day when writing ICS.
  // For timed events, DTEND is the actual end timestamp (or +1 hour if not set).
  let dtend: string
  if (params.allDay) {
    const exclusiveEnd = params.endDate
      ? new Date(params.endDate)
      : new Date(params.startDate)
    exclusiveEnd.setDate(exclusiveEnd.getDate() + 1)
    dtend = `DTEND;VALUE=DATE:${formatICSDate(exclusiveEnd, true)}`
  } else {
    dtend = params.endDate
      ? `DTEND:${formatICSDate(params.endDate, false)}`
      : `DTEND:${formatICSDate(new Date(params.startDate.getTime() + 3_600_000), false)}`
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cairn//Cairn Itinerary//EN',
    'BEGIN:VEVENT',
    `UID:${params.uid}`,
    `DTSTAMP:${now}`,
    `LAST-MODIFIED:${now}`,
    dtstart,
    dtend,
    `SUMMARY:${escapeICS(params.title)}`,
  ]

  if (params.recurrenceId) {
    const recId = params.allDay
      ? `RECURRENCE-ID;VALUE=DATE:${formatICSDate(params.recurrenceId, true)}`
      : `RECURRENCE-ID:${formatICSDate(params.recurrenceId, false)}`
    lines.push(recId)
  }
  if (params.recurrenceRule) lines.push(`RRULE:${params.recurrenceRule}`)
  if (params.location) lines.push(`LOCATION:${escapeICS(params.location)}`)
  if (params.notes)    lines.push(`DESCRIPTION:${escapeICS(params.notes)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

// ─── DAV client factory ───────────────────────────────────────────────────────

async function makeClient(appleId: string, password: string) {
  return createDAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: { username: appleId, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Discover all calendar names available for a given iCloud account.
 * Used to populate a select in settings after the user saves credentials.
 */
export async function listICloudCalendars(appleId: string, password: string): Promise<string[]> {
  const client = await makeClient(appleId, password)
  const calendars = await client.fetchCalendars()
  return calendars
    .filter(c => c.components?.includes('VEVENT'))
    .map(c => (c.displayName as string | undefined) ?? '')
    .filter(Boolean) as string[]
}

/**
 * Fetch all events from the stored calendar URL within a date range.
 */
export async function fetchICloudEvents(
  appleId: string,
  password: string,
  calendarUrl: string,
  from: Date,
  to: Date,
): Promise<ICalEvent[]> {
  const client = await makeClient(appleId, password)
  const objects = await client.fetchCalendarObjects({
    calendar: { url: calendarUrl },
    timeRange: {
      start: from.toISOString(),
      end: to.toISOString(),
    },
  })

  return objects.flatMap(obj =>
    obj.data ? parseICSEvents(obj.data as string, obj.url, from, to) : []
  )
}

/**
 * Discover and store the URL for a named calendar.
 */
export async function resolveCalendarUrl(
  appleId: string,
  password: string,
  calendarName: string,
): Promise<string | null> {
  const client = await makeClient(appleId, password)
  const calendars = await client.fetchCalendars()
  const match = calendars.find(
    c => (c.displayName as string | undefined)?.toLowerCase() === calendarName.toLowerCase() && c.components?.includes('VEVENT')
  )
  return match?.url ?? null
}

/**
 * Create a new event in iCloud. Returns the UID and URL of the created event.
 */
export async function createICloudEvent(
  appleId: string,
  password: string,
  calendarUrl: string,
  params: { title: string; startDate: Date; endDate: Date | null; allDay: boolean; notes?: string | null; location?: string | null },
): Promise<{ uid: string; url: string }> {
  const client = await makeClient(appleId, password)
  const uid = `${randomUUID()}@cairn`
  const ics = generateICS({ uid, ...params })
  const filename = `${uid}.ics`

  const response = await client.createCalendarObject({
    calendar: { url: calendarUrl },
    filename,
    iCalString: ics,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`iCloud rejected event creation (${response.status}): ${body || response.statusText}`)
  }

  return { uid, url: `${calendarUrl.replace(/\/$/, '')}/${filename}` }
}

/**
 * Update an existing iCloud event.
 */
export async function updateICloudEvent(
  appleId: string,
  password: string,
  eventUrl: string,
  params: { uid: string; title: string; startDate: Date; endDate: Date | null; allDay: boolean; notes?: string | null; location?: string | null },
): Promise<void> {
  const client = await makeClient(appleId, password)
  // No etag — unconditional PUT. iCloud rejects the If-Match: * wildcard.
  const response = await client.updateCalendarObject({
    calendarObject: {
      url: eventUrl,
      data: generateICS(params),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`iCloud rejected event update (${response.status}): ${body || response.statusText}`)
  }
}

/**
 * Delete an iCloud event by its URL.
 */
/**
 * Fetch events from a public iCal feed URL (no auth). Supports webcal:// URLs.
 */
export async function fetchSubscriptionEvents(
  feedUrl: string,
  from: Date,
  to: Date,
): Promise<ICalEvent[]> {
  const url = feedUrl.replace(/^webcal:\/\//i, 'https://')
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed to fetch feed (${res.status})`)
  const icsString = await res.text()
  return parseICSEvents(icsString, url, from, to)
}

export async function deleteICloudEvent(
  appleId: string,
  password: string,
  eventUrl: string,
): Promise<void> {
  const client = await makeClient(appleId, password)
  // No etag — unconditional DELETE. iCloud rejects the If-Match: * wildcard.
  const response = await client.deleteCalendarObject({
    calendarObject: { url: eventUrl },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`iCloud rejected event deletion (${response.status}): ${body || response.statusText}`)
  }
}
