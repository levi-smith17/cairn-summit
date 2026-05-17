"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const PAGE_SIZE = 15;
const WAYPOINTS_PER_TRAIL = 5;
function queryAll(pk, prefix) {
    return db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
        TableName: db_1.TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
    }));
}
function toMarkerEntry(m) {
    return {
        markerId: m.id,
        marker: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
    };
}
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const qs = event.queryStringParameters ?? {};
        const page = Math.max(1, parseInt(qs.page ?? '1', 10));
        const search = qs.search ?? '';
        const markerIds = qs.markerId ? qs.markerId.split(',').filter(Boolean) : [];
        const filterTrailId = qs.trailId && qs.trailId !== 'all' ? qs.trailId : null;
        const sort = qs.sort ?? 'alpha';
        const readLater = qs.readLater === 'true';
        const dateFrom = qs.dateFrom ?? '';
        const dateTo = qs.dateTo ?? '';
        const [trailsResult, waypointsResult, markersResult, logsResult] = await Promise.all([
            queryAll(pk, 'TRAIL#'),
            queryAll(pk, 'WAYPOINT#'),
            queryAll(pk, 'MARKER#'),
            queryAll(pk, 'LOG#'),
        ]);
        const rawTrails = (trailsResult.Items ?? []).map((t) => ({
            id: t.sk.split('#').pop(),
            name: t.name,
            createdAt: t.createdAt,
        }));
        const tags = (markersResult.Items ?? []).map((m) => ({
            id: m.sk.split('#').pop(),
            name: m.name,
            color: m.color,
            icon: m.icon ?? null,
        }));
        // Group all waypoints (unfiltered) by trail for _count
        const allWaypointsByTrail = new Map();
        for (const w of waypointsResult.Items ?? []) {
            const tid = w.trailId ?? null;
            if (tid)
                allWaypointsByTrail.set(tid, (allWaypointsByTrail.get(tid) ?? 0) + 1);
        }
        // Normalize waypoints
        let waypoints = (waypointsResult.Items ?? []).map((w) => ({
            id: w.sk.split('#').pop(),
            title: w.title,
            url: w.url,
            favicon: w.favicon ?? null,
            read: w.read ?? false,
            readLater: w.readLater ?? false,
            trailId: w.trailId ?? null,
            markers: (w.markers ?? []).map(toMarkerEntry),
            createdAt: w.createdAt,
        }));
        // Apply filters
        if (search) {
            const q = search.toLowerCase();
            waypoints = waypoints.filter(w => w.title?.toLowerCase().includes(q) || w.url?.toLowerCase().includes(q));
        }
        if (markerIds.length > 0) {
            waypoints = waypoints.filter(w => markerIds.some(id => w.markers.some((m) => m.markerId === id)));
        }
        if (filterTrailId) {
            waypoints = waypoints.filter(w => w.trailId === filterTrailId);
        }
        if (readLater) {
            waypoints = waypoints.filter(w => w.readLater);
        }
        if (dateFrom) {
            const from = new Date(dateFrom).getTime();
            waypoints = waypoints.filter(w => new Date(w.createdAt).getTime() >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo).getTime();
            waypoints = waypoints.filter(w => new Date(w.createdAt).getTime() <= to);
        }
        // Sort waypoints
        if (sort === 'newest') {
            waypoints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        else if (sort === 'oldest') {
            waypoints.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        else {
            waypoints.sort((a, b) => a.title.localeCompare(b.title));
        }
        // Group filtered waypoints by trail
        const filteredWaypointsByTrail = new Map();
        for (const w of waypoints) {
            const tid = w.trailId ?? null;
            if (tid) {
                if (!filteredWaypointsByTrail.has(tid))
                    filteredWaypointsByTrail.set(tid, []);
                filteredWaypointsByTrail.get(tid).push(w);
            }
        }
        // Normalize logs
        const allLogs = (logsResult.Items ?? []).map((l) => ({
            id: l.sk.split('#').pop(),
            content: l.content,
            trailId: l.trailId ?? null,
            waypointId: l.waypointId ?? null,
            markers: (l.markers ?? []).map(toMarkerEntry),
            createdAt: l.createdAt,
        }));
        const logCountByTrail = new Map();
        const logsByWaypoint = new Map();
        for (const log of allLogs) {
            if (log.trailId) {
                logCountByTrail.set(log.trailId, (logCountByTrail.get(log.trailId) ?? 0) + 1);
            }
            if (log.waypointId) {
                if (!logsByWaypoint.has(log.waypointId))
                    logsByWaypoint.set(log.waypointId, []);
                logsByWaypoint.get(log.waypointId).push(log);
            }
        }
        const hasWaypointFilter = !!(search || markerIds.length > 0 || readLater || dateFrom || dateTo);
        // Filter and sort trails
        let activeTrails = rawTrails.filter(t => {
            const hasFilteredWaypoints = (filteredWaypointsByTrail.get(t.id)?.length ?? 0) > 0;
            const hasLogs = (logCountByTrail.get(t.id) ?? 0) > 0;
            if (hasWaypointFilter)
                return hasFilteredWaypoints;
            return hasFilteredWaypoints || hasLogs;
        });
        if (filterTrailId) {
            activeTrails = activeTrails.filter(t => t.id === filterTrailId);
        }
        if (sort === 'oldest') {
            activeTrails.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        else if (sort === 'newest') {
            activeTrails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        else {
            activeTrails.sort((a, b) => a.name.localeCompare(b.name));
        }
        // Paginate
        const skip = (page - 1) * PAGE_SIZE;
        const pageTrails = activeTrails.slice(skip, skip + PAGE_SIZE);
        const hasMore = skip + PAGE_SIZE < activeTrails.length;
        // Build folders
        const filteredCountMap = {};
        const folders = pageTrails.map(t => {
            const trailWaypoints = filteredWaypointsByTrail.get(t.id) ?? [];
            filteredCountMap[t.id] = trailWaypoints.length;
            const topWaypoints = trailWaypoints.slice(0, WAYPOINTS_PER_TRAIL).map(w => ({
                ...w,
                logs: (logsByWaypoint.get(w.id) ?? [])
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 1),
            }));
            return {
                id: t.id,
                name: t.name,
                waypoints: topWaypoints,
                _count: {
                    waypoints: allWaypointsByTrail.get(t.id) ?? 0,
                    logs: logCountByTrail.get(t.id) ?? 0,
                },
            };
        });
        const allFolders = rawTrails.map(t => ({ id: t.id, name: t.name }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            folders,
            hasMore,
            tags,
            allFolders,
            filteredCountMap,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map