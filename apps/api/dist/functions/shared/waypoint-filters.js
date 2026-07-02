"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWaypointFilterParams = parseWaypointFilterParams;
exports.filterWaypoints = filterWaypoints;
exports.sortWaypoints = sortWaypoints;
function parseWaypointFilterParams(qs) {
    return {
        search: qs.search ?? '',
        markerIds: qs.markerId ? qs.markerId.split(',').filter(Boolean) : [],
        readLater: qs.readLater === 'true',
        dateFrom: qs.dateFrom ?? '',
        dateTo: qs.dateTo ?? '',
        sort: qs.sort ?? 'alpha',
    };
}
function filterWaypoints(waypoints, params) {
    let result = [...waypoints];
    if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter(w => w.title?.toLowerCase().includes(q) || w.url?.toLowerCase().includes(q));
    }
    if (params.markerIds.length > 0) {
        result = result.filter(w => params.markerIds.some(id => w.markers.some(m => m.markerId === id)));
    }
    if (params.readLater) {
        result = result.filter(w => w.readLater);
    }
    if (params.dateFrom) {
        const from = new Date(params.dateFrom).getTime();
        result = result.filter(w => new Date(w.createdAt).getTime() >= from);
    }
    if (params.dateTo) {
        const to = new Date(params.dateTo).getTime();
        result = result.filter(w => new Date(w.createdAt).getTime() <= to);
    }
    return result;
}
function sortWaypoints(waypoints, sort) {
    const result = [...waypoints];
    if (sort === 'newest') {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else if (sort === 'oldest') {
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    else {
        result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
}
//# sourceMappingURL=waypoint-filters.js.map