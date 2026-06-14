"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUserItineraryEvents = fetchUserItineraryEvents;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const db_1 = require("./db");
const caldav_1 = require("./caldav");
const ical_1 = require("./ical");
function defaultWindow() {
    const from = new Date();
    from.setMonth(from.getMonth() - 3);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setMonth(to.getMonth() + 12);
    to.setHours(23, 59, 59, 999);
    return { from, to };
}
function toExternalEvent(event, calendarId, color) {
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
    };
}
async function getPassword(ssm, path) {
    const result = await ssm.send(new client_ssm_1.GetParameterCommand({
        Name: path,
        WithDecryption: true,
    }));
    return result.Parameter?.Value ?? '';
}
async function fetchUserItineraryEvents(pk, from, to) {
    const window = defaultWindow();
    const rangeFrom = from ?? window.from;
    const rangeTo = to ?? window.to;
    const ssm = new client_ssm_1.SSMClient({ region: process.env.AWS_REGION });
    const [calendarsResult, subscriptionsResult] = await Promise.all([
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
    const calendars = (calendarsResult.Items ?? []);
    const subscriptions = (subscriptionsResult.Items ?? []);
    const calDavFetches = calendars
        .filter(c => c.syncEnabled !== false)
        .map(async (cal) => {
        const id = cal.sk.replace('ITINERARY#', '');
        try {
            const password = await getPassword(ssm, cal.ssmPasswordPath);
            const events = await (0, caldav_1.fetchCalDavEvents)(cal.serverUrl ?? 'https://caldav.icloud.com', cal.appleId, password, cal.name, rangeFrom, rangeTo);
            return events.map(e => toExternalEvent(e, id, cal.color));
        }
        catch (err) {
            console.error(`CalDAV fetch failed for calendar ${id}:`, err);
            return [];
        }
    });
    const subFetches = subscriptions
        .filter(s => s.syncEnabled !== false)
        .map(async (sub) => {
        const id = sub.sk.replace('ITINERARY_SUB#', '');
        try {
            const events = await (0, ical_1.fetchSubscriptionEvents)(sub.url, rangeFrom, rangeTo);
            return events.map(e => toExternalEvent(e, id, sub.color));
        }
        catch (err) {
            console.error(`ICS fetch failed for subscription ${id}:`, err);
            return [];
        }
    });
    const batches = await Promise.all([...calDavFetches, ...subFetches]);
    return batches.flat().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}
//# sourceMappingURL=itinerary-events.js.map