"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const DEFAULT_SETTINGS = {
    appearance: {
        sidebarDefault: 'EXPANDED',
        defaultLandingPage: '/waypoints',
        dateFormat: 'MDY',
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
        compactView: false,
        showSnippets: true,
        browserNotifications: false,
        notificationSound: true,
    },
};
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const [profileResult, settingsResult, calendarsResult, subscriptionsResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk: 'SETTINGS' } })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ITINERARY#' },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ITINERARY_SUB#' },
            })),
        ]);
        const profile = profileResult.Item ?? {};
        const settings = settingsResult.Item ?? {};
        const signals = {
            ...DEFAULT_SETTINGS.signals,
            ...(settings.signals ?? {}),
            browserNotifications: settings.signals?.browserNotifications
                ?? settings.notifications?.browserNotifications
                ?? DEFAULT_SETTINGS.signals.browserNotifications,
            notificationSound: settings.signals?.notificationSound
                ?? settings.notifications?.notificationSound
                ?? DEFAULT_SETTINGS.signals.notificationSound,
        };
        const calendars = (calendarsResult.Items ?? []).map(({ ssmPasswordPath: _omit, ...rest }) => ({
            ...rest,
            id: rest.sk.replace('ITINERARY#', ''),
        }));
        const calendarSubscriptions = (subscriptionsResult.Items ?? []).map(item => ({
            ...item,
            id: item.sk.replace('ITINERARY_SUB#', ''),
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            account: {
                name: profile.name ?? null,
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
            privacy: { ...DEFAULT_SETTINGS.privacy, ...(settings.privacy ?? {}) },
            itinerary: { ...DEFAULT_SETTINGS.itinerary, ...(settings.itinerary ?? {}) },
            waypoints: { ...DEFAULT_SETTINGS.waypoints, ...(settings.waypoints ?? {}) },
            logs: { ...DEFAULT_SETTINGS.logs, ...(settings.logs ?? {}) },
            signals,
            calendars,
            calendarSubscriptions,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map