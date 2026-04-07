// Luvi Calendar System
// A 14-month, 26-days-per-month calendar developed by Levi Smith & Luke Lindeman.
// Each month has two weeks: "-a" (days 1–13) and "-i" (days 14–26).
// A 15th month (Leapemberi) appears as a 48-hour leap day on Gregorian leap years.
// Source: https://github.com/lsmith2-edison/luvi

export const LUVI_MONTHS = [
  'Unember',       // 1  (odd → -ember)
  'Duober',        // 2  (even → -ober)
  'Triember',      // 3
  'Quartober',     // 4
  'Quintember',    // 5
  'Senober',       // 6
  'September',     // 7
  'October',       // 8
  'November',      // 9
  'Decober',       // 10
  'Undember',      // 11
  'Duodenober',    // 12
  'Tredecember',   // 13
  'Quartodecober', // 14
  'Leapemberi',    // 15 (leap day only)
] as const

export const LUVI_DAYS = [
  'Monday',
  'Duoday',
  'Triday',
  'Tetraday',
  'Pentaday',
  'Hexaday',
  'Heptaday',
  'Octoday',
  'Enneaday',
  'Decaday',
  'Hendecaday',
  'Dodecaday',
  'Triadecaday',
] as const

export type CalendarMode = 'gregorian' | 'luvi' | 'luvi-full'

export interface LuviDate {
  monthIndex: number      // 0-based index into LUVI_MONTHS
  monthName: string       // e.g. "Unember"
  week: 'a' | 'i'        // which half of the month
  dayInWeek: number       // 0-based position within week (0–12)
  dayName: string         // e.g. "Monday"
  dayOfMonth: number      // 1–26 (friendly day number within month)
  dayOfYear: number       // 1–365/366
  year: number
  isLeapDay: boolean
  /** Short display: "Unember 5th" */
  friendly: string
  /** Full display: "Unembera Monday" */
  full: string
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getDayOfYear(date: Date): number {
  // Use UTC arithmetic to avoid DST offsets skewing the day count.
  // date.getFullYear/Month/Date() returns local wall-clock values, which is
  // what we want — we just do the diff in UTC so no 23-hour days creep in.
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** Convert a Gregorian Date to a LuviDate. */
export function toLuvi(date: Date): LuviDate {
  const year = date.getFullYear()
  const dayOfYear = getDayOfYear(date)
  const leap = isLeapYear(year)

  // Leap day: day 366 of a leap year → Leapemberi
  if (leap && dayOfYear === 366) {
    return {
      monthIndex: 14,
      monthName: 'Leapemberi',
      week: 'i',
      dayInWeek: 0,
      dayName: '',
      dayOfMonth: 1,
      dayOfYear,
      year,
      isLeapDay: true,
      friendly: 'Leapemberi (48 Hours Long)',
      full: 'Leapemberi (48 Hours Long)',
    }
  }

  // Port of PHP getLuviMonthInt / convertToLuvi logic
  let monthInt = Math.floor(dayOfYear / 26)
  const rem = dayOfYear % 26
  const week: 'a' | 'i' = rem === 0 || rem > 13 ? 'i' : 'a'
  let dayInWeek = rem === 0 ? 12 : rem > 13 ? rem - 14 : rem - 1
  if (dayInWeek === 12 && monthInt !== 0) monthInt -= 1

  const friendlyDayNumber = week === 'i' ? dayInWeek + 14 : dayInWeek + 1

  const monthName = LUVI_MONTHS[monthInt] ?? 'Unknown'
  const dayName = LUVI_DAYS[dayInWeek] ?? ''

  return {
    monthIndex: monthInt,
    monthName,
    week,
    dayInWeek,
    dayName,
    dayOfMonth: friendlyDayNumber,
    dayOfYear,
    year,
    isLeapDay: false,
    friendly: `${monthName} ${ordinal(friendlyDayNumber)}`,
    full: `${monthName}${week} ${dayName}`,
  }
}

/**
 * Return all 26 Gregorian dates that belong to the Luvi month containing `anchor`.
 * Index 0–12 = week -a, index 13–25 = week -i.
 */
export function luviMonthDates(anchor: Date): Date[] {
  const { monthIndex, year } = toLuvi(anchor)
  // Day-of-year of the first day of this Luvi month
  const firstDayOfYear = monthIndex * 26 + 1
  return Array.from({ length: 26 }, (_, i) => new Date(year, 0, firstDayOfYear + i))
}

/**
 * Return the 13 Gregorian dates for the Luvi week containing `anchor`.
 * (either the -a or -i half of its Luvi month)
 */
export function luviWeekDates(anchor: Date): Date[] {
  const { monthIndex, week, year } = toLuvi(anchor)
  const firstDayOfYear = monthIndex * 26 + 1
  const weekOffset = week === 'a' ? 0 : 13
  return Array.from({ length: 13 }, (_, i) => new Date(year, 0, firstDayOfYear + weekOffset + i))
}

/** Navigation label for Full Luvi mode. */
export function luviNavLabel(view: 'month' | 'week' | 'day', anchor: Date): string {
  const l = toLuvi(anchor)
  if (view === 'month') return `${l.monthName} ${l.year}`
  if (view === 'week') return `${l.monthName}${l.week} ${l.year}`
  return l.full
}

/** Format a Date as a Luvi string. */
export function formatLuvi(date: Date, mode: 'friendly' | 'full' = 'friendly'): string {
  const l = toLuvi(date)
  return mode === 'friendly' ? l.friendly : l.full
}
