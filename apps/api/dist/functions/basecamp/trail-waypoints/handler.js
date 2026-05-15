"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const DEFAULT_PAGE_SIZE = 5;
const handler = async (event) => {
    try {
        const qs = event.queryStringParameters ?? {};
        const trailId = qs.trailId;
        if (!trailId)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('trailId is required'));
        const pk = (0, auth_1.getPk)(event);
        const userId = (0, auth_1.getUserId)(event);
        const page = Math.max(1, parseInt(qs.page ?? '1', 10));
        const pageSize = Math.min(50, Math.max(1, parseInt(qs.pageSize ?? String(DEFAULT_PAGE_SIZE), 10)));
        const sort = qs.sort ?? 'newest';
        // Use GSI to efficiently fetch only waypoints for this trail
        const [waypointsResult, logsResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                IndexName: 'gsi1',
                KeyConditionExpression: 'gsi1pk = :gsi1pk',
                ExpressionAttributeValues: { ':gsi1pk': `TRAIL#${trailId}` },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'LOG#' },
            })),
        ]);
        // Verify the trail belongs to this user by checking waypoint pk
        const rawWaypoints = (waypointsResult.Items ?? []).filter((w) => w.pk === `USER#${userId}`);
        const logsByWaypoint = new Map();
        for (const log of logsResult.Items ?? []) {
            if (!log.waypointId)
                continue;
            if (!logsByWaypoint.has(log.waypointId))
                logsByWaypoint.set(log.waypointId, []);
            logsByWaypoint.get(log.waypointId).push({
                id: log.sk.split('#').pop(),
                content: log.content ?? '',
                createdAt: log.createdAt,
            });
        }
        let waypoints = rawWaypoints.map((w) => ({
            id: w.sk.split('#').pop(),
            title: w.title,
            url: w.url,
            favicon: w.favicon ?? null,
            read: w.read ?? false,
            readLater: w.readLater ?? false,
            trailId: w.trailId ?? null,
            markers: (w.markers ?? []).map((m) => ({
                markerId: m.id,
                marker: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
            })),
            createdAt: w.createdAt,
            logs: (logsByWaypoint.get(w.sk.split('#').pop()) ?? [])
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3),
        }));
        if (sort === 'oldest') {
            waypoints.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        else if (sort === 'alpha') {
            waypoints.sort((a, b) => a.title.localeCompare(b.title));
        }
        else {
            waypoints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        const filteredCount = waypoints.length;
        const skip = (page - 1) * pageSize;
        const paged = waypoints.slice(skip, skip + pageSize);
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ waypoints: paged, filteredCount }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map