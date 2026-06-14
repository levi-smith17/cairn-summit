import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { dynamo, TABLE_NAME } from './db'
import { fetchCalDavEvents } from './caldav'
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

interface CalendarItem {
    sk: string
    name: string
    color: string
    appleId: string
    serverUrl: string
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
): Promise<ExternalItineraryEvent[]> {
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

    const calDavFetches = calendars
        .filter(c => c.syncEnabled !== false)
        .map(async cal => {
            const id = cal.sk.replace('ITINERARY#', '')
            try {
                const password = await getPassword(ssm, cal.ssmPasswordPath)
                const events = await fetchCalDavEvents(
                    cal.serverUrl ?? 'https://caldav.icloud.com',
                    cal.appleId,
                    password,
                    cal.name,
                    rangeFrom,
                    rangeTo,
                )
                return events.map(e => toExternalEvent(e, id, cal.color))
            } catch (err) {
                console.error(`CalDAV fetch failed for calendar ${id}:`, err)
                return []
            }
        })

    const subFetches = subscriptions
        .filter(s => s.syncEnabled !== false)
        .map(async sub => {
            const id = sub.sk.replace('ITINERARY_SUB#', '')
            try {
                const events = await fetchSubscriptionEvents(sub.url, rangeFrom, rangeTo)
                return events.map(e => toExternalEvent(e, id, sub.color))
            } catch (err) {
                console.error(`ICS fetch failed for subscription ${id}:`, err)
                return []
            }
        })

    const batches = await Promise.all([...calDavFetches, ...subFetches])
    return batches.flat().sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
}
