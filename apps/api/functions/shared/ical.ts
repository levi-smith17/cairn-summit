import { WINDOWS_TO_IANA } from './windows-timezones'

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

interface ICSProperty {
    value: string
    params: Record<string, string>
}

function parseICSProperty(ics: string, key: string): ICSProperty | null {
    const re = new RegExp(`^${key}((?:;[^:\\r\\n]+)*):([^\\r\\n]+)`, 'm')
    const match = ics.match(re)
    if (!match) return null

    const params: Record<string, string> = {}
    for (const part of match[1].split(';').filter(Boolean)) {
        const eq = part.indexOf('=')
        if (eq === -1) params[part.toUpperCase()] = 'TRUE'
        else {
            const raw = part.slice(eq + 1)
            // Outlook often quotes TZIDs: TZID="Eastern Standard Time"
            params[part.slice(0, eq).toUpperCase()] = raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
        }
    }

    return { params, value: match[2].trim() }
}

function isValidTimeZone(timeZone: string): boolean {
    try {
        // Some runtimes only throw when formatting; force evaluation.
        new Intl.DateTimeFormat('en-US', { timeZone }).format(0)
        return true
    } catch {
        return false
    }
}

/** Resolve ICS TZID (IANA or Windows) to an IANA zone Intl accepts. */
export function resolveIanaTimeZone(tzid: string | null | undefined): string | null {
    if (!tzid) return null
    let tz = tzid
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    tz = tz.replace(/^tzone:\/\/Microsoft\//i, '')
    tz = tz.replace(/^\//, '')
    if (!tz) return null
    if (isValidTimeZone(tz)) return tz

    // Display-name variants Outlook sometimes emits instead of Windows IDs.
    const displayAliases: Record<string, string> = {
        'Eastern Time (US & Canada)': 'Eastern Standard Time',
        'Eastern Daylight Time': 'Eastern Standard Time',
        '(UTC-05:00) Eastern Time (US & Canada)': 'Eastern Standard Time',
        'Central Time (US & Canada)': 'Central Standard Time',
        'Pacific Time (US & Canada)': 'Pacific Standard Time',
        'Mountain Time (US & Canada)': 'Mountain Standard Time',
    }
    const alias = displayAliases[tz]
    if (alias) tz = alias

    const mapped = WINDOWS_TO_IANA[tz] ?? WINDOWS_TO_IANA[tz.replace(/_/g, ' ')]
    if (mapped && isValidTimeZone(mapped)) return mapped

    // Offset TZIDs like GMT-0400, GMT-04:00, UTC+0530 — map to Etc/GMT (POSIX sign inverted).
    const offset = tz.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/i)
    if (offset) {
        const sign = offset[1] === '-' ? '+' : '-'
        const hours = Number(offset[2])
        const minutes = Number(offset[3] ?? '0')
        if (minutes === 0 && hours >= 0 && hours <= 14) {
            const etc = `Etc/GMT${sign}${hours}`
            if (isValidTimeZone(etc)) return etc
        }
    }
    // Fallback: GMT-0400 style already partially matched above; also accept GMT0400 without sign separator.
    const compact = tz.match(/^(?:GMT|UTC)([+-]?)(\d{2})(\d{2})$/i)
    if (compact) {
        const rawSign = compact[1] || '+'
        const sign = rawSign === '-' ? '+' : '-'
        const hours = Number(compact[2])
        const minutes = Number(compact[3])
        if (minutes === 0 && hours >= 0 && hours <= 14) {
            const etc = `Etc/GMT${sign}${hours}`
            if (isValidTimeZone(etc)) return etc
        }
    }
    return null
}

function zonedComponentsToUtc(
    comps: { year: number; month: number; day: number; hour: number; minute: number; second: number },
    timeZone: string,
): Date {
    const desiredUtc = Date.UTC(
        comps.year,
        comps.month - 1,
        comps.day,
        comps.hour,
        comps.minute,
        comps.second,
    )
    let utcMs = desiredUtc

    let formatter: Intl.DateTimeFormat
    try {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    } catch {
        // Unknown zone — treat as floating local time rather than failing the whole feed.
        return new Date(comps.year, comps.month - 1, comps.day, comps.hour, comps.minute, comps.second)
    }

    for (let i = 0; i < 4; i++) {
        const parts = formatter.formatToParts(new Date(utcMs))
        const read = (type: Intl.DateTimeFormatPartTypes) =>
            Number(parts.find(part => part.type === type)?.value ?? '0')
        const asUtc = Date.UTC(
            read('year'),
            read('month') - 1,
            read('day'),
            read('hour'),
            read('minute'),
            read('second'),
        )
        const diff = desiredUtc - asUtc
        if (diff === 0) break
        utcMs += diff
    }

    return new Date(utcMs)
}

function parseICSDate(value: string, tzid?: string | null): { date: Date; allDay: boolean } {
    if (/^\d{8}$/.test(value)) {
        const y = parseInt(value.slice(0, 4), 10)
        const m = parseInt(value.slice(4, 6), 10) - 1
        const d = parseInt(value.slice(6, 8), 10)
        return { date: new Date(y, m, d), allDay: true }
    }
    if (value.endsWith('Z')) {
        return {
            date: new Date(value.replace(
                /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
                '$1-$2-$3T$4:$5:$6Z',
            )),
            allDay: false,
        }
    }
    const m = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
    if (m) {
        const comps = {
            year: +m[1],
            month: +m[2],
            day: +m[3],
            hour: +m[4],
            minute: +m[5],
            second: +m[6],
        }
        const iana = resolveIanaTimeZone(tzid)
        if (iana) {
            return { date: zonedComponentsToUtc(comps, iana), allDay: false }
        }
        return {
            date: new Date(comps.year, comps.month - 1, comps.day, comps.hour, comps.minute, comps.second),
            allDay: false,
        }
    }
    return { date: new Date(value), allDay: false }
}

function parseICSDateProperty(property: ICSProperty | null): { date: Date; allDay: boolean } | null {
    if (!property) return null
    if (property.params.VALUE === 'DATE') {
        return parseICSDate(property.value)
    }
    return parseICSDate(property.value, property.params.TZID ?? null)
}

function extractICSValue(ics: string, key: string): string | null {
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
    const freq = rule.FREQ
    const interval = parseInt(rule.INTERVAL ?? '1', 10)
    const count = rule.COUNT ? parseInt(rule.COUNT, 10) : Infinity
    const until = rule.UNTIL ? parseICSDate(rule.UNTIL).date : null
    const byDay = rule.BYDAY ? rule.BYDAY.split(',') : null

    const DOW: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

    const duration = base.endDate ? base.endDate.getTime() - base.startDate.getTime() : 0
    const endLimit = until && until < to ? until : to

    const results: ICalEvent[] = []
    const seenOccurrenceKeys = new Set<string>()
    let current = new Date(base.startDate)
    let n = 0

    while (current <= endLimit && n < count && n < 2000) {
        const dateKey = current.toISOString().slice(0, 10)
        const occurrenceKey = current.toISOString()
        const inWindow = current >= from && current <= to
        const notExcluded = !exDates.has(dateKey)

        if (inWindow && notExcluded && !seenOccurrenceKeys.has(occurrenceKey)) {
            seenOccurrenceKeys.add(occurrenceKey)
            results.push({
                ...base,
                uid: `${base.uid}:${occurrenceKey}`,
                startDate: new Date(current),
                endDate: duration > 0 ? new Date(current.getTime() + duration) : null,
            })
        }

        const next = new Date(current)
        switch (freq) {
            case 'DAILY':
                next.setDate(next.getDate() + interval)
                break
            case 'WEEKLY':
                if (byDay && byDay.length > 1) {
                    next.setDate(next.getDate() + 1)
                    let found = false
                    for (let i = 0; i < 7 * interval; i++) {
                        const dayAbbr = Object.keys(DOW).find(k => DOW[k] === next.getDay())
                        if (dayAbbr && byDay.some(d => d.endsWith(dayAbbr))) {
                            found = true
                            break
                        }
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
                return results
        }
        current = next
        n++
    }

    return results
}

/** RFC 5545 line unfolding: CRLF/LF followed by a space or tab continues the previous line. */
export function unfoldICS(icsString: string): string {
    return icsString.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
}

export function parseICSEvents(
    icsString: string,
    url: string,
    from?: Date,
    to?: Date,
): ICalEvent[] {
    const windowFrom = from ?? new Date(0)
    const windowTo = to ?? new Date(8_640_000_000_000_000)
    const unfolded = unfoldICS(icsString)

    const overrides = new Set<string>()
    const vevents = extractVEvents(unfolded)

    for (const vevent of vevents) {
        try {
            const uid = extractICSValue(vevent, 'UID')
            const recIdProp = parseICSProperty(vevent, 'RECURRENCE-ID')
            if (uid && recIdProp) {
                const recId = parseICSDateProperty(recIdProp)
                if (recId) overrides.add(`${uid}:${recId.date.toISOString().slice(0, 10)}`)
            }
        } catch {
            // Skip malformed recurrence overrides (exotic TZIDs, etc.)
        }
    }

    return vevents.flatMap(vevent => {
      try {
        const uid = extractICSValue(vevent, 'UID')
        const summary = extractICSValue(vevent, 'SUMMARY')
        const dtstartProp = parseICSProperty(vevent, 'DTSTART')
        const dtendProp = parseICSProperty(vevent, 'DTEND')
        const description = extractICSValue(vevent, 'DESCRIPTION')
        const location = extractICSValue(vevent, 'LOCATION')
        const rrule = extractICSValue(vevent, 'RRULE')
        const recIdProp = parseICSProperty(vevent, 'RECURRENCE-ID')

        if (!uid || !dtstartProp) return []

        const start = parseICSDateProperty(dtstartProp)
        const end = dtendProp ? parseICSDateProperty(dtendProp) : null
        if (!start) return []

        let endDate = end?.date ?? null
        if (start.allDay && endDate) {
            const adj = new Date(endDate)
            adj.setDate(adj.getDate() - 1)
            endDate = adj
        }

        const base: ICalEvent = {
            uid,
            url,
            title: summary ?? '(No title)',
            startDate: start.date,
            endDate,
            allDay: start.allDay,
            notes: description,
            location,
            recurrenceRule: rrule ?? null,
        }

        if (recIdProp) {
            return start.date >= windowFrom && start.date <= windowTo ? [base] : []
        }

        if (rrule) {
            const exDates = new Set<string>()
            const exDateRaw = extractICSValue(vevent, 'EXDATE')
            if (exDateRaw) {
                exDateRaw.split(',').forEach(v => {
                    const d = parseICSDate(v.trim())
                    exDates.add(d.date.toISOString().slice(0, 10))
                })
            }
            return expandRRule(base, rrule, exDates, windowFrom, windowTo)
                .filter(e => !overrides.has(`${uid}:${e.startDate.toISOString().slice(0, 10)}`))
        }

        return start.date >= windowFrom && start.date <= windowTo ? [base] : []
      } catch {
        // Skip malformed events (e.g. exotic TZIDs) instead of failing the whole feed.
        return []
      }
    })
}

export async function fetchSubscriptionEvents(
    feedUrl: string,
    from: Date,
    to: Date,
): Promise<ICalEvent[]> {
    const url = feedUrl.replace(/^webcal:\/\//i, 'https://')
    const res = await fetch(url, {
        headers: {
            Accept: 'text/calendar, text/plain, */*',
            'User-Agent': 'Asgard-Dagatal/1.0 (ICS subscription sync)',
        },
        redirect: 'follow',
    })
    if (!res.ok) throw new Error(`Failed to fetch subscription feed (${res.status})`)
    const icsString = await res.text()
    const trimmed = icsString.trim()
    if (!trimmed) throw new Error('Subscription feed was empty')
    if (!/BEGIN:VCALENDAR/i.test(trimmed) && !/BEGIN:VEVENT/i.test(trimmed)) {
        throw new Error(
            'Subscription URL did not return an ICS calendar feed. Check the URL in Thing → Dagatal.',
        )
    }
    return parseICSEvents(icsString, url, from, to)
}
