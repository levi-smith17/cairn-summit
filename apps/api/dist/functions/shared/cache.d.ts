import type { Cache } from '@cairn/types';
export declare function cacheCompositeId(item: Pick<Cache, 'sk'> & {
    id?: string;
}): string;
export declare function findCacheById(items: (Cache & {
    id?: string;
})[], id: string): (Cache & {
    id?: string;
}) | undefined;
//# sourceMappingURL=cache.d.ts.map