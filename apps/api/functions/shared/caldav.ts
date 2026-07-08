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

function extractTagFromSuccessfulPropstats(chunk: string, tag: string): string | null {
    const propstats = chunk.split(/<(?:[\w-]+:)?propstat\b/i).slice(1)
    for (const propstat of propstats) {
        if (!/HTTP\/1\.1\s+200\b/i.test(propstat)) continue
        const value = extractTag(propstat, tag)
        if (value) return value
    }
    return extractTag(chunk, tag)
}

function extractCalendarDataBlocks(xml: string): string[] {
    const responses = xml.split(/<(?:[\w-]+:)?response\b/i).slice(1)
    const blocks: string[] = []

    for (const chunk of responses) {
        const propstats = chunk.split(/<(?:[\w-]+:)?propstat\b/i).slice(1)
        for (const propstat of propstats) {
            if (!/HTTP\/1\.1\s+200\b/i.test(propstat)) continue
            const re = /<(?:[\w-]+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?calendar-data>/gi
            let match
            while ((match = re.exec(propstat)) !== null) {
                const decoded = decodeXmlText(match[1].trim())
                if (decoded.includes('BEGIN:VCALENDAR')) {
                    blocks.push(decoded)
                }
            }
        }
    }

    return blocks
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
        'User-Agent': 'Cairn-CalDAV/1.0',
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

function extractHrefFromTagContent(content: string): string | null {
    const hrefMatch = content.match(/<(?:[\w-]+:)?href[^>]*>([^<]*)<\/(?:[\w-]+:)?href>/i)
    if (!hrefMatch) return null
    const href = decodeURIComponent(hrefMatch[1].trim())
    return href || null
}

function extractHrefFromSuccessfulPropstats(xml: string, tag: string): string | null {
    const responses = xml.split(/<(?:[\w-]+:)?response\b/i).slice(1)
    for (const chunk of responses) {
        const propstats = chunk.split(/<(?:[\w-]+:)?propstat\b/i).slice(1)
        for (const propstat of propstats) {
            if (!/HTTP\/1\.1\s+200\b/i.test(propstat)) continue
            const tagRe = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'i')
            const tagMatch = propstat.match(tagRe)
            if (!tagMatch) continue
            if (/<(?:[\w-]+:)?unauthenticated\b/i.test(tagMatch[1])) {
                throw new Error('CalDAV authentication failed (invalid Apple ID or app password)')
            }
            const href = extractHrefFromTagContent(tagMatch[1])
            if (href) return href
        }
    }

    return extractHref(xml, tag)
}

function normalizeServerUrl(serverUrl: string): string {
    const trimmed = serverUrl.trim().replace(/\/+$/, '')
    return trimmed || 'https://caldav.icloud.com'
}

function principalDiscoveryUrls(serverUrl: string): string[] {
    const normalized = normalizeServerUrl(serverUrl)
    const origin = new URL(normalized.endsWith('://') ? `${normalized}/` : normalized).origin
    return [
        `${origin}/`,
        `${origin}/.well-known/caldav`,
        normalized,
    ]
}
function extractHref(xml: string, tag: string): string | null {
    const tagRe = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'i')
    const tagMatch = xml.match(tagRe)
    if (!tagMatch) return null

    return extractHrefFromTagContent(tagMatch[1])
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
<propfind xmlns="DAV:">
  <prop><current-user-principal/></prop>
</propfind>`
    let lastError: Error | null = null

    for (const url of principalDiscoveryUrls(serverUrl)) {
        try {
            const xml = await davRequest('PROPFIND', url, auth, body, '0')
            const href = extractHrefFromSuccessfulPropstats(xml, 'current-user-principal')
            if (href) return resolveHref(url, href)
            lastError = new Error(`CalDAV principal not found at ${url}`)
        } catch (err) {
            lastError = err instanceof Error ? err : new Error('CalDAV principal discovery failed')
            if (lastError.message.includes('authentication failed')) throw lastError
        }
    }

    throw lastError ?? new Error('CalDAV principal not found')
}

async function getCalendarHome(principalUrl: string, auth: string): Promise<string> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<propfind xmlns="DAV:" xmlns:cal="${CALDAV_NS}">
  <prop><cal:calendar-home-set/></prop>
</propfind>`
    const xml = await davRequest('PROPFIND', principalUrl, auth, body, '0')
    const href = extractHrefFromSuccessfulPropstats(xml, 'calendar-home-set')
    if (!href) throw new Error('CalDAV calendar-home-set not found')
    return resolveHref(principalUrl, href)
}

/** Parse a DAV href from multistatus XML (used in tests and principal discovery). */
export function parseDavHref(xml: string, tag: string): string | null {
    return extractHrefFromSuccessfulPropstats(xml, tag)
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
        const displayName = extractTagFromSuccessfulPropstats(chunk, 'displayname') ?? ''
        calendars.push({
            url: resolveHref(homeUrl, href),
            displayName,
        })
    }

    return calendars
}

async function listCalendars(homeUrl: string, auth: string): Promise<CalDavCalendar[]> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<propfind xmlns="DAV:" xmlns:cal="${CALDAV_NS}">
  <prop>
    <displayname/>
    <resourcetype/>
    <cal:supported-calendar-component-set/>
  </prop>
</propfind>`
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
    return extractCalendarDataBlocks(xml)
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
