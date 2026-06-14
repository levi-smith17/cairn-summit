"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
function extractId(sk) {
    return sk.split('#').pop() ?? sk;
}
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function matchesQuery(text, query) {
    return (text ?? '').toLowerCase().includes(query);
}
function scoreMatch(titleMatch, bodyMatch) {
    if (titleMatch)
        return 2;
    if (bodyMatch)
        return 1;
    return 0;
}
const handler = async (event) => {
    try {
        const query = event.queryStringParameters?.q?.trim().toLowerCase();
        if (!query)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('q query parameter is required'));
        const deep = event.queryStringParameters?.deep === 'true';
        const pk = (0, auth_1.getPk)(event);
        const prefixes = [
            { prefix: 'WAYPOINT#', type: 'waypoint' },
            { prefix: 'LOG#', type: 'log' },
            { prefix: 'SUPPLYLINE#', type: 'provision' },
            { prefix: 'TRAIL#', type: 'trail' },
            { prefix: 'MARKER#', type: 'marker' },
            { prefix: 'STOP#', type: 'stop' },
        ];
        const queryResults = await Promise.all(prefixes.map(({ prefix }) => db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
        }))));
        const results = [];
        for (let i = 0; i < prefixes.length; i++) {
            const { type } = prefixes[i];
            for (const item of queryResults[i].Items ?? []) {
                const id = extractId(item.sk);
                if (type === 'waypoint') {
                    const titleMatch = matchesQuery(item.title, query);
                    const bodyMatch = matchesQuery(item.url, query)
                        || matchesQuery(item.description, query)
                        || matchesQuery(item.notes, query);
                    const score = scoreMatch(titleMatch, bodyMatch);
                    if (!score)
                        continue;
                    results.push({
                        id,
                        type,
                        title: item.title || item.url,
                        subtitle: item.url,
                        url: `/waypoints?id=${id}`,
                        externalUrl: item.url,
                        score,
                    });
                }
                else if (type === 'log') {
                    const plainContent = stripHtml(item.content ?? '');
                    const titleMatch = matchesQuery(item.title, query);
                    const bodyMatch = deep && matchesQuery(plainContent, query);
                    const score = scoreMatch(titleMatch, bodyMatch);
                    if (!score)
                        continue;
                    results.push({
                        id,
                        type,
                        title: item.title || 'Untitled log',
                        url: `/logs?id=${id}`,
                        score,
                    });
                }
                else if (type === 'provision') {
                    const titleMatch = matchesQuery(item.name, query);
                    if (!titleMatch)
                        continue;
                    results.push({
                        id,
                        type,
                        title: item.name,
                        url: '/provisions',
                        score: 2,
                    });
                }
                else if (type === 'trail') {
                    const titleMatch = matchesQuery(item.name, query);
                    if (!titleMatch)
                        continue;
                    results.push({
                        id,
                        type,
                        title: item.name,
                        url: '/trails',
                        score: 2,
                    });
                }
                else if (type === 'marker') {
                    const titleMatch = matchesQuery(item.name, query);
                    if (!titleMatch)
                        continue;
                    results.push({
                        id,
                        type,
                        title: item.name,
                        url: '/markers',
                        color: item.color,
                        score: 2,
                    });
                }
                else if (type === 'stop') {
                    const titleMatch = matchesQuery(item.title, query)
                        || matchesQuery(item.summary, query);
                    if (!titleMatch)
                        continue;
                    results.push({
                        id,
                        type,
                        title: item.title || 'Calendar event',
                        subtitle: item.summary,
                        url: '/itinerary',
                        score: 2,
                    });
                }
            }
        }
        results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(results));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map