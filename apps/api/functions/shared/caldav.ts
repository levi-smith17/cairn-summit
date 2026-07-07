import { parseICSEvents, type ICalEvent } from './ical'

const CALDAV_NS = 'urn:ietf:params:xml:ns:caldav'

function basicAuth(username: string, password: string): string {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function decodeXmlText(value: string): string {
    return value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
}

function extractTag(xml: string, tag: string): string | null {
    const re = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'i')
    const match = xml.match(re)
    return match ? decodeXmlText(match[1].trim()) : null
}

async function davRequest(
    method: string,
    url: string,
    auth: string,
    body?: string,
    depth?: string,
): Promise<string> {
    const headers: Record<string, string> = {
        Authorization: auth,
        Accept: 'application/xml,text/xml',
    }
    if (body) headers['Content-Type'] = 'application/xml; charset=utf-8'
    if (depth) headers.Depth = depth

    const res = await fetch(url, { method, headers, body })
    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`CalDAV ${method} ${url} failed (${res.status}): ${text.slice(0, 200)}`)
    }
    return res.text()
}

function extractHref(xml: string, tag: string): string | null {
    const tagRe = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'i')
    const tagMatch = xml.match(tagRe)
    if (!tagMatch) return null

    const hrefMatch = tagMatch[1].match(/<(?:[\w-]+:)?href>([^<]+)<\/(?:[\w-]+:)?href>/i)
    return hrefMatch ? decodeURIComponent(hrefMatch[1].trim()) : null
}

function resolveHref(base: string, href: string): string {
    if (href.startsWith('http')) return href
    const origin = new URL(base).origin
    return href.startsWith('/') ? `${origin}${href}` : `${base.replace(/\/$/, '')}/${href}`
}

function formatCalDavDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

interface CalDavCalendar {
    url: string
    displayName: string
}

async function getPrincipalUrl(serverUrl: string, auth: string): Promise<string> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal/></d:prop>
</d:propfind>`
    const xml = await davRequest('PROPFIND', serverUrl, auth, body, '0')
    const href = extractHref(xml, 'current-user-principal')
    if (!href) throw new Error('CalDAV principal not found')
    return resolveHref(serverUrl, href)
}

async function getCalendarHome(principalUrl: string, auth: string): Promise<string> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cal="${CALDAV_NS}">
  <d:prop><cal:calendar-home-set/></d:prop>
</d:propfind>`
    const xml = await davRequest('PROPFIND', principalUrl, auth, body, '0')
    const href = extractHref(xml, 'calendar-home-set')
    if (!href) throw new Error('CalDAV calendar-home-set not found')
    return resolveHref(principalUrl, href)
}

export function parseCalDavCalendarList(xml: string, homeUrl: string): CalDavCalendar[] {
    const responses = xml.split(/<(?:[\w-]+:)?response\b/i).slice(1)
    const calendars: CalDavCalendar[] = []

    for (const chunk of responses) {
        const hasCalendar = /<(?:[\w-]+:)?calendar\b/i.test(chunk)
        const supportsEvents = /VEVENT/i.test(chunk)
        if (!hasCalendar || !supportsEvents) continue

        const hrefMatch = chunk.match(/<(?:[\w-]+:)?href>([^<]+)<\/(?:[\w-]+:)?href>/i)
        if (!hrefMatch) continue
        const href = decodeURIComponent(hrefMatch[1].trim())
        const displayName = extractTag(chunk, 'displayname') ?? ''
        calendars.push({
            url: resolveHref(homeUrl, href),
            displayName,
        })
    }

    return calendars
}

async function listCalendars(homeUrl: string, auth: string): Promise<CalDavCalendar[]> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cal="${CALDAV_NS}">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <cal:supported-calendar-component-set/>
  </d:prop>
</d:propfind>`
    const xml = await davRequest('PROPFIND', homeUrl, auth, body, '1')
    return parseCalDavCalendarList(xml, homeUrl)
}

async function fetchCalendarObjects(
    calendarUrl: string,
    auth: string,
    from: Date,
    to: Date,
): Promise<string[]> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="${CALDAV_NS}">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${formatCalDavDate(from)}" end="${formatCalDavDate(to)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`
    const xml = await davRequest('REPORT', calendarUrl, auth, body, '1')
    const dataBlocks: string[] = []
    const re = /<(?:[\w-]+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?calendar-data>/gi
    let match
    while ((match = re.exec(xml)) !== null) {
        dataBlocks.push(decodeXmlText(match[1].trim()))
    }
    return dataBlocks
}

/** Discover iCloud calendar display names (used for settings validation). */
export async function listICloudCalendarNames(
    serverUrl: string,
    appleId: string,
    password: string,
): Promise<string[]> {
    const auth = basicAuth(appleId, password)
    const principalUrl = await getPrincipalUrl(serverUrl, auth)
    const homeUrl = await getCalendarHome(principalUrl, auth)
    const calendars = await listCalendars(homeUrl, auth)
    return calendars.map(c => c.displayName).filter(Boolean)
}

/** Resolve a named calendar to its CalDAV collection URL. */
export async function resolveCalendarUrl(
    serverUrl: string,
    appleId: string,
    password: string,
    calendarName: string,
): Promise<string | null> {
    const auth = basicAuth(appleId, password)
    const principalUrl = await getPrincipalUrl(serverUrl, auth)
    const homeUrl = await getCalendarHome(principalUrl, auth)
    const calendars = await listCalendars(homeUrl, auth)

    const target = calendars.find(
        c => c.displayName.toLowerCase() === calendarName.toLowerCase(),
    )
    return target?.url ?? null
}

export async function fetchCalDavEventsByUrl(
    serverUrl: string,
    appleId: string,
    password: string,
    calendarUrl: string,
    from: Date,
    to: Date,
): Promise<ICalEvent[]> {
    const auth = basicAuth(appleId, password)
    const icsBlocks = await fetchCalendarObjects(calendarUrl, auth, from, to)
    return icsBlocks.flatMap(ics => parseICSEvents(ics, calendarUrl, from, to))
}

export async function fetchCalDavEvents(
    serverUrl: string,
    appleId: string,
    password: string,
    calendarName: string,
    from: Date,
    to: Date,
    calendarUrl?: string | null,
): Promise<ICalEvent[]> {
    if (calendarUrl) {
        return fetchCalDavEventsByUrl(serverUrl, appleId, password, calendarUrl, from, to)
    }

    const auth = basicAuth(appleId, password)
    const principalUrl = await getPrincipalUrl(serverUrl, auth)
    const homeUrl = await getCalendarHome(principalUrl, auth)
    const calendars = await listCalendars(homeUrl, auth)

    const target = calendars.find(
        c => c.displayName.toLowerCase() === calendarName.toLowerCase(),
    )
    if (!target) return []

    const icsBlocks = await fetchCalendarObjects(target.url, auth, from, to)
    return icsBlocks.flatMap(ics => parseICSEvents(ics, target.url, from, to))
}
