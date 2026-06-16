import type { Cache } from '@cairn/types'

export function cacheCompositeId(item: Pick<Cache, 'sk'> & { id?: string }): string {
    return item.id ?? item.sk.replace(/^CACHE#/, '')
}

export function findCacheById(
    items: (Cache & { id?: string })[],
    id: string,
): (Cache & { id?: string }) | undefined {
    return items.find(item => cacheCompositeId(item) === id)
}
