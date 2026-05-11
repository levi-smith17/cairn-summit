// ─── RRULE helpers for Cairn native recurring stops ──────────────────────────

const DOW_ABBR = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export type RecurrenceFrequency =
  | 'none' | 'daily' | 'weekday' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface RecurrenceValues {
  frequency: RecurrenceFrequency
  days: string[]      // BYDAY day codes e.g. ['MO', 'WE']
  endType: 'never' | 'date' | 'count'
  endDate: string     // YYYY-MM-DD (only when endType='date')
  endCount: number    // (only when endType='count')
}

export function defaultRecurrence(startDate: Date): RecurrenceValues {
  return {
    frequency: 'none',
    days: [DOW_ABBR[startDate.getDay()]],
    endType: 'never',
    endDate: '',
    endCount: 10,
  }
}

/** Parse an RRULE string into form values. */
export function rruleToValues(rrule: string | null, startDate: Date): RecurrenceValues {
  const def = defaultRecurrence(startDate)
  if (!rrule) return def

  const parts: Record<string, string> = {}
  rrule.split(';').forEach(p => {
    const eq = p.indexOf('=')
    if (eq !== -1) parts[p.slice(0, eq)] = p.slice(eq + 1)
  })

  const freq     = parts.FREQ ?? ''
  const byday    = parts.BYDAY ?? ''
  const interval = parseInt(parts.INTERVAL ?? '1', 10)

  let frequency: RecurrenceFrequency = 'none'
  if (freq === 'DAILY') {
    frequency = 'daily'
  } else if (freq === 'WEEKLY') {
    if (byday === 'MO,TU,WE,TH,FR') frequency = 'weekday'
    else if (interval === 2)          frequency = 'biweekly'
    else                              frequency = 'weekly'
  } else if (freq === 'MONTHLY') {
    frequency = 'monthly'
  } else if (freq === 'YEARLY') {
    frequency = 'yearly'
  }

  const days = byday ? byday.split(',') : [DOW_ABBR[startDate.getDay()]]

  let endType: RecurrenceValues['endType'] = 'never'
  let endDate = ''
  let endCount = 10
  if (parts.UNTIL) {
    endType = 'date'
    const u = parts.UNTIL.replace(/T.*$/, '') // strip time if present
    endDate = `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`
  } else if (parts.COUNT) {
    endType = 'count'
    endCount = parseInt(parts.COUNT, 10)
  }

  return { frequency, days, endType, endDate, endCount }
}

/** Convert form values back to an RRULE string (or null for 'none'). */
export function valuesToRRule(values: RecurrenceValues): string | null {
  if (values.frequency === 'none') return null

  const parts: string[] = []

  switch (values.frequency) {
    case 'daily':
      parts.push('FREQ=DAILY')
      break
    case 'weekday':
      parts.push('FREQ=WEEKLY', 'BYDAY=MO,TU,WE,TH,FR')
      break
    case 'weekly':
      parts.push('FREQ=WEEKLY')
      if (values.days.length) parts.push(`BYDAY=${values.days.join(',')}`)
      break
    case 'biweekly':
      parts.push('FREQ=WEEKLY', 'INTERVAL=2')
      if (values.days.length) parts.push(`BYDAY=${values.days.join(',')}`)
      break
    case 'monthly':
      parts.push('FREQ=MONTHLY')
      break
    case 'yearly':
      parts.push('FREQ=YEARLY')
      break
  }

  if (values.endType === 'date' && values.endDate) {
    parts.push(`UNTIL=${values.endDate.replace(/-/g, '')}`)
  } else if (values.endType === 'count' && values.endCount > 0) {
    parts.push(`COUNT=${values.endCount}`)
  }

  return parts.join(';')
}

/** Human-readable summary of a recurrence rule. */
export function rruleLabel(rrule: string | null): string {
  if (!rrule) return 'Does not repeat'
  const parts: Record<string, string> = {}
  rrule.split(';').forEach(p => {
    const eq = p.indexOf('=')
    if (eq !== -1) parts[p.slice(0, eq)] = p.slice(eq + 1)
  })
  const freq     = parts.FREQ ?? ''
  const byday    = parts.BYDAY ?? ''
  const interval = parseInt(parts.INTERVAL ?? '1', 10)

  if (freq === 'DAILY') return 'Daily'
  if (freq === 'WEEKLY') {
    if (byday === 'MO,TU,WE,TH,FR') return 'Every weekday'
    if (interval === 2) return `Every 2 weeks${byday ? ` on ${byday}` : ''}`
    return `Weekly${byday ? ` on ${byday}` : ''}`
  }
  if (freq === 'MONTHLY') return 'Monthly'
  if (freq === 'YEARLY')  return 'Yearly'
  return rrule
}

// ─── Stop expansion ───────────────────────────────────────────────────────────

export interface ExpandedOccurrence {
  /** ID of the master Stop record. */
  masterId: string
  /** The calculated start date for this occurrence. */
  startDate: Date
  /** End date offset from master (null if master has no end date). */
  endDate: Date | null
}

/** Expand a recurring stop's RRULE into individual occurrences within [from, to]. */
export function expandStopOccurrences(
  masterId: string,
  masterStart: Date,
  masterEnd: Date | null,
  rrule: string,
  exceptionDatesJson: string | null,
  from: Date,
  to: Date,
): ExpandedOccurrence[] {
  const exDates = new Set<string>()
  if (exceptionDatesJson) {
    try {
      const arr = JSON.parse(exceptionDatesJson) as string[]
      arr.forEach(d => exDates.add(d.slice(0, 10)))
    } catch { /* ignore */ }
  }

  const parts: Record<string, string> = {}
  rrule.split(';').forEach(p => {
    const eq = p.indexOf('=')
    if (eq !== -1) parts[p.slice(0, eq)] = p.slice(eq + 1)
  })

  const freq     = parts.FREQ
  const interval = parseInt(parts.INTERVAL ?? '1', 10)
  const count    = parts.COUNT ? parseInt(parts.COUNT, 10) : Infinity
  const until    = parts.UNTIL ? parseICSDateSimple(parts.UNTIL) : null
  const byDay    = parts.BYDAY ? parts.BYDAY.split(',') : null

  const DOW: Record<string, number> = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 }
  const duration = masterEnd ? masterEnd.getTime() - masterStart.getTime() : 0
  const endLimit = until && until < to ? until : to

  const results: ExpandedOccurrence[] = []
  let current = new Date(masterStart)
  let n = 0

  while (current <= endLimit && n < count && n < 2000) {
    const dateKey = toLocalDateKey(current)
    if (current >= from && !exDates.has(dateKey)) {
      results.push({
        masterId,
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
          for (let i = 0; i < 7 * interval; i++) {
            const abbr = DOW_ABBR[next.getDay()]
            if (byDay.includes(abbr)) break
            next.setDate(next.getDate() + 1)
          }
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

function parseICSDateSimple(value: string): Date {
  const d = value.replace(/T.*$/, '')
  return new Date(
    parseInt(d.slice(0, 4)),
    parseInt(d.slice(4, 6)) - 1,
    parseInt(d.slice(6, 8)),
  )
}

/** Returns YYYY-MM-DD in local time. */
export function toLocalDateKey(date: Date): string {
  const y  = date.getFullYear()
  const m  = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Truncates an RRULE by setting UNTIL to the day before `cutoff`. */
export function truncateRRule(rrule: string, cutoff: Date): string {
  const dayBefore = new Date(cutoff)
  dayBefore.setDate(dayBefore.getDate() - 1)
  const until = toLocalDateKey(dayBefore).replace(/-/g, '')
  // Remove existing UNTIL/COUNT, add new UNTIL
  const cleaned = rrule.split(';').filter(p => !p.startsWith('UNTIL=') && !p.startsWith('COUNT=')).join(';')
  return `${cleaned};UNTIL=${until}`
}
