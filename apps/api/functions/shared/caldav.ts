import { createDAVClient } from 'tsdav'
import { parseICSEvents, type ICalEvent } from './ical'

async function makeClient(serverUrl: string, appleId: string, password: string) {
    return createDAVClient({
        serverUrl,
        credentials: { username: appleId, password },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
    })
}

/** Discover iCloud calendar display names (used for settings validation). */
export async function listICloudCalendarNames(
    serverUrl: string,
    appleId: string,
    password: string,
): Promise<string[]> {
    const client = await makeClient(serverUrl, appleId, password)
    const calendars = await client.fetchCalendars()
    return calendars
        .filter(c => c.components?.includes('VEVENT'))
        .map(c => (c.displayName as string | undefined) ?? '')
        .filter(Boolean)
}

/** Resolve a named calendar to its CalDAV collection URL. */
export async function resolveCalendarUrl(
    serverUrl: string,
    appleId: string,
    password: string,
    calendarName: string,
): Promise<string | null> {
    const client = await makeClient(serverUrl, appleId, password)
    const calendars = await client.fetchCalendars()
    const match = calendars.find(
        c =>
            (c.displayName as string | undefined)?.toLowerCase() === calendarName.toLowerCase()
            && c.components?.includes('VEVENT'),
    )
    return match?.url ?? null
}

export async function fetchCalDavEventsByUrl(
    serverUrl: string,
    appleId: string,
    password: string,
    calendarUrl: string,
    from: Date,
    to: Date,
): Promise<ICalEvent[]> {
    const client = await makeClient(serverUrl, appleId, password)
    const objects = await client.fetchCalendarObjects({
        calendar: { url: calendarUrl },
        timeRange: {
            start: from.toISOString(),
            end: to.toISOString(),
        },
    })

    return objects.flatMap(obj =>
        obj.data ? parseICSEvents(obj.data as string, obj.url ?? calendarUrl, from, to) : [],
    )
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
    const resolvedUrl =
        calendarUrl
        ?? await resolveCalendarUrl(serverUrl, appleId, password, calendarName)
    if (!resolvedUrl) return []

    return fetchCalDavEventsByUrl(serverUrl, appleId, password, resolvedUrl, from, to)
}
