import type { UseQueryResult } from '@tanstack/react-query'

/** True while any query has no cached data yet (initial route load). */
export function isInitialRouteLoad(queries: Pick<UseQueryResult, 'isPending' | 'data'>[]): boolean {
  return queries.some(q => q.isPending && q.data === undefined)
}

/** True when refetching with stale data visible (filter/month/page changes). */
export function isSectionRefetching(queries: Pick<UseQueryResult, 'isFetching' | 'data'>[]): boolean {
  return queries.some(q => q.isFetching && q.data !== undefined)
}
