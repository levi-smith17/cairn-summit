import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

const DEFAULT_SETTINGS = {
    appearance: {
        sidebarDefault: 'EXPANDED',
        defaultLandingPage: '/waypoints',
        dateFormat: 'MDY',
    },
    notifications: {
        browserNotifications: false,
        emailDigest: 'NEVER',
    },
    privacy: {
        manifestVisibility: 'PRIVATE',
        contactFormEnabled: false,
    },
    itinerary: {
        defaultView: 'MONTH',
        firstDayOfWeek: 'SUNDAY',
        defaultEventDuration: 60,
        showWeekNumbers: false,
    },
    waypoints: {
        defaultSort: 'NEWEST',
        openInNewTab: true,
        waypointsPerPage: 25,
    },
    logs: {
        logsPerPage: 25,
        defaultSort: 'NEWEST',
    },
    signals: {
        messagesPerPage: 25,
        autoMarkRead: true,
        autoRefreshInterval: 15,
        defaultView: 'SIGNALS',
        compactView: false,
        showSnippets: true,
    },
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const [profileResult, settingsResult, calendarsResult, subscriptionsResult] = await Promise.all([
            dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
            dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'SETTINGS' } })),
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

        const profile = profileResult.Item ?? {}
        const settings = settingsResult.Item ?? {}

        const calendars = (calendarsResult.Items ?? []).map(({ ssmPasswordPath: _omit, ...rest }) => ({
            ...rest,
            id: rest.sk.replace('ITINERARY#', ''),
        }))

        const calendarSubscriptions = (subscriptionsResult.Items ?? []).map(item => ({
            ...item,
            id: item.sk.replace('ITINERARY_SUB#', ''),
        }))

        return toApiGatewayResponse(ok({
            account: {
                name: profile.name ?? null,
                email: profile.email ?? null,
                image: profile.image ?? null,
                username: profile.username ?? null,
                timeFormat: profile.timeFormat ?? 'TWELVE',
                listed: profile.listed ?? false,
                defaultTerminology: profile.defaultTerminology ?? 'CAIRN',
                defaultTheme: profile.defaultTheme ?? 'SYSTEM',
                headline: profile.headline ?? null,
                summary: profile.summary ?? null,
                location: profile.location ?? null,
                linkedin: profile.linkedin ?? null,
                github: profile.github ?? null,
                customDomain: profile.customDomain ?? null,
            },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...(settings.appearance ?? {}) },
            notifications: { ...DEFAULT_SETTINGS.notifications, ...(settings.notifications ?? {}) },
            privacy: { ...DEFAULT_SETTINGS.privacy, ...(settings.privacy ?? {}) },
            itinerary: { ...DEFAULT_SETTINGS.itinerary, ...(settings.itinerary ?? {}) },
            waypoints: { ...DEFAULT_SETTINGS.waypoints, ...(settings.waypoints ?? {}) },
            logs: { ...DEFAULT_SETTINGS.logs, ...(settings.logs ?? {}) },
            signals: { ...DEFAULT_SETTINGS.signals, ...(settings.signals ?? {}) },
            calendars,
            calendarSubscriptions,
        }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
