export interface NormalizedWaypoint {
    id: string;
    title: string;
    url: string;
    favicon: string | null;
    read: boolean;
    readLater: boolean;
    trailId: string | null;
    markers: {
        markerId: string;
        marker: {
            id: string;
            name: string;
            color: string;
            icon: string | null;
        };
    }[];
    createdAt: string;
}
export interface WaypointFilterParams {
    search: string;
    markerIds: string[];
    readLater: boolean;
    dateFrom: string;
    dateTo: string;
    sort: string;
}
export declare function parseWaypointFilterParams(qs: Record<string, string | undefined>): WaypointFilterParams;
export declare function filterWaypoints<T extends NormalizedWaypoint>(waypoints: T[], params: WaypointFilterParams): T[];
export declare function sortWaypoints<T extends NormalizedWaypoint>(waypoints: T[], sort: string): T[];
//# sourceMappingURL=waypoint-filters.d.ts.map