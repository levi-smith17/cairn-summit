export interface ResolvedMarker {
    id: string;
    name: string;
    color: string;
    icon?: string;
}
export declare function resolveMarkersById(pk: string, markerIds: string[]): Promise<Map<string, ResolvedMarker>>;
//# sourceMappingURL=markers.d.ts.map