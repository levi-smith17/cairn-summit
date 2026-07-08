import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { dynamo, TABLE_NAME } from './db'
import { fetchCalDavEvents, listICloudCalendarNames, resolveCalendarUrl } from './caldav'
import { fetchSubscriptionEvents, type ICalEvent } from './ical'

export interface ExternalItineraryEvent {
    uid: string
    title: string
    startDate: string
    endDate: string | null
    allDay: boolean
    location: string | null
    notes: string | null
    color: string
    readonly: boolean
    calendarId: string
    url: string
    recurrenceRule: string | null
}

export type CalendarSyncStatus = {
    calendarId: string
    name: string
    source: 'icloud' | 'subscription'
    status: 'ok' | 'not_found' | 'auth_failed' | 'error'
    eventCount: number
    availableNames?: string[]
    message?: string
}

export type ItineraryEventsResult = {
    events: ExternalItineraryEvent[]
    calendarSync: CalendarSyncStatus[]
}

interface CalendarItem {
    sk: string
    name: string
    color: string
    appleId: string
    serverUrl: string
    calendarUrl?: string
    syncEnabled?: boolean
    ssmPasswordPath: string
}

interface SubscriptionItem {
    sk: string
    name: string
    url: string
    color: string
    syncEnabled?: boolean
}

function defaultWindow(): { from: Date; to: Date } {
    const from = new Date()
    from.setMonth(from.getMonth() - 3)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setMonth(to.getMonth() + 12)
    to.setHours(23, 59, 59, 999)
    return { from, to }
}

function toExternalEvent(
    event: ICalEvent,
    calendarId: string,
    color: string,
): ExternalItineraryEvent {
    return {
        uid: event.uid,
        title: event.title,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        allDay: event.allDay,
        location: event.location,
        notes: event.notes,
        color,
        readonly: true,
        calendarId,
        url: event.url,
        recurrenceRule: event.recurrenceRule,
    }
}

async function getPassword(ssm: SSMClient, path: string): Promise<string> {
    const result = await ssm.send(new GetParameterCommand({
        Name: path,
        WithDecryption: true,
    }))
    return result.Parameter?.Value ?? ''
}

export async function fetchUserItineraryEvents(
    pk: string,
    from?: Date,
    to?: Date,
): Promise<ItineraryEventsResult> {
    const window = defaultWindow()
    const rangeFrom = from ?? window.from
    const rangeTo = to ?? window.to
    const ssm = new SSMClient({ region: process.env.AWS_REGION })

    const [calendarsResult, subscriptionsResult] = await Promise.all([
        dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ITINERARY#' },
        })),
        dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ITINERARY_SUB#' },
        })),
    ])

    const calendars = (calendarsResult.Items ?? []) as CalendarItem[]
    const subscriptions = (subscriptionsResult.Items ?? []) as SubscriptionItem[]
    const calendarSync: CalendarSyncStatus[] = []

    const calDavFetches = calendars
        .filter(c => c.syncEnabled !== false)
        .map(async cal => {
            const id = cal.sk.replace('ITINERARY#', '')
            const serverUrl = cal.serverUrl ?? 'https://caldav.icloud.com'
            try {
                const password = await getPassword(ssm, cal.ssmPasswordPath)
                if (!password) {
                    const message = `Missing iCloud app password for "${cal.name}"`
                    console.error(`${message} (${cal.ssmPasswordPath})`)
                    calendarSync.push({
                        calendarId: id,
                        name: cal.name,
                        source: 'icloud',
                        status: 'auth_failed',
                        eventCount: 0,
                        message,
                    })
                    return []
                }

                let calendarUrl = cal.calendarUrl ?? null
                if (!calendarUrl) {
                    calendarUrl = await resolveCalendarUrl(serverUrl, cal.appleId, password, cal.name)
                    if (calendarUrl) {
                        await dynamo.send(new UpdateCommand({
                            TableName: TABLE_NAME,
                            Key: { pk, sk: cal.sk },
                            UpdateExpression: 'SET calendarUrl = :calendarUrl',
                            ExpressionAttributeValues: { ':calendarUrl': calendarUrl },
                        })).catch(err => {
                            console.error(`Failed to persist calendarUrl for ${id}:`, err)
                        })
                    }
                }

                if (!calendarUrl) {
                    const availableNames = await listICloudCalendarNames(
                        serverUrl,
                        cal.appleId,
                        password,
                    ).catch(() => [])
                    const message = availableNames.length
                        ? `Calendar "${cal.name}" not found on iCloud. Available: ${availableNames.join(', ')}`
                        : `Calendar "${cal.name}" not found on iCloud`
                    console.error(message)
                    calendarSync.push({
                        calendarId: id,
                        name: cal.name,
                        source: 'icloud',
                        status: 'not_found',
                        eventCount: 0,
                        availableNames,
                        message,
                    })
                    return []
                }

                const events = await fetchCalDavEvents(
                    serverUrl,
                    cal.appleId,
                    password,
                    cal.name,
                    rangeFrom,
                    rangeTo,
                    calendarUrl,
                )
                calendarSync.push({
                    calendarId: id,
                    name: cal.name,
                    source: 'icloud',
                    status: 'ok',
                    eventCount: events.length,
                })
                return events.map(e => toExternalEvent(e, id, cal.color))
            } catch (err) {
                const message = err instanceof Error ? err.message : 'CalDAV fetch failed'
                console.error(`CalDAV fetch failed for calendar ${id}:`, err)
                calendarSync.push({
                    calendarId: id,
                    name: cal.name,
                    source: 'icloud',
                    status: message.includes('(401)') || message.includes('(403)') || message.includes('authentication failed')
                        ? 'auth_failed'
                        : 'error',
                    eventCount: 0,
                    message,
                })
                return []
            }
        })

    const subFetches = subscriptions
        .filter(s => s.syncEnabled !== false)
        .map(async sub => {
            const id = sub.sk.replace('ITINERARY_SUB#', '')
            try {
                const events = await fetchSubscriptionEvents(sub.url, rangeFrom, rangeTo)
                calendarSync.push({
                    calendarId: id,
                    name: sub.name,
                    source: 'subscription',
                    status: 'ok',
                    eventCount: events.length,
                })
                return events.map(e => toExternalEvent(e, id, sub.color))
            } catch (err) {
                const message = err instanceof Error ? err.message : 'ICS fetch failed'
                console.error(`ICS fetch failed for subscription ${id}:`, err)
                calendarSync.push({
                    calendarId: id,
                    name: sub.name,
                    source: 'subscription',
                    status: 'error',
                    eventCount: 0,
                    message,
                })
                return []
            }
        })

    const batches = await Promise.all([...calDavFetches, ...subFetches])
    const events = batches.flat().sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    return { events, calendarSync }
}
