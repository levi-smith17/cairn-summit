export type SortOption = 'newest' | 'oldest' | 'alpha'

export interface FilterState {
  search: string
  markerIds: string[]
  trailId: string
  sort: SortOption
  readLater: boolean
  unattached: boolean
  dateFrom: string
  dateTo: string
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  markerIds: [],
  trailId: 'all',
  sort: 'alpha',
  readLater: false,
  unattached: false,
  dateFrom: '',
  dateTo: '',
}

export function parseFiltersFromParams(params: URLSearchParams): FilterState {
  return {
    search: params.get('search') ?? DEFAULT_FILTERS.search,
    markerIds: params.get('markerId')?.split(',').filter(Boolean) ?? [],
    trailId: params.get('trailId') ?? DEFAULT_FILTERS.trailId,
    sort: (params.get('sort') as SortOption) ?? DEFAULT_FILTERS.sort,
    readLater: params.get('readLater') === 'true',
    unattached: params.get('unattached') === 'true',
    dateFrom: params.get('dateFrom') ?? DEFAULT_FILTERS.dateFrom,
    dateTo: params.get('dateTo') ?? DEFAULT_FILTERS.dateTo,
  }
}

export function filtersToParams(filters: Partial<FilterState>): URLSearchParams {
  const params = new URLSearchParams()
  const merged = { ...DEFAULT_FILTERS, ...filters }

  if (merged.search) params.set('search', merged.search)
  if (merged.markerIds.length > 0) params.set('markerId', merged.markerIds.join(','))
  if (merged.trailId !== 'all') params.set('trailId', merged.trailId)
  if (merged.sort !== 'alpha') params.set('sort', merged.sort)
  if (merged.readLater) params.set('readLater', 'true')
  if (merged.unattached) params.set('unattached', 'true')
  if (merged.dateFrom) params.set('dateFrom', merged.dateFrom)
  if (merged.dateTo) params.set('dateTo', merged.dateTo)

  return params
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== DEFAULT_FILTERS.search ||
    filters.markerIds.length > 0 ||
    filters.trailId !== DEFAULT_FILTERS.trailId ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.readLater !== DEFAULT_FILTERS.readLater ||
    filters.unattached !== DEFAULT_FILTERS.unattached ||
    filters.dateFrom !== DEFAULT_FILTERS.dateFrom ||
    filters.dateTo !== DEFAULT_FILTERS.dateTo
  )
}

// Client-side filter functions

export function applyWaypointFilters(waypoints: any[], filters: FilterState): any[] {
  let result = [...waypoints]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(w =>
      w.title?.toLowerCase().includes(q) || w.url?.toLowerCase().includes(q)
    )
  }

  if (filters.markerIds.length > 0) {
    result = result.filter(w =>
      filters.markerIds.some(id => w.markers?.some((m: any) => m.markerId === id))
    )
  }

  if (filters.trailId !== 'all') {
    result = result.filter(w => w.trailId === filters.trailId)
  }

  if (filters.readLater) {
    result = result.filter(w => w.readLater === true)
  }

  if (filters.unattached) {
    result = result.filter(w => !w.markers?.length)
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()
    result = result.filter(w => new Date(w.createdAt).getTime() >= from)
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime()
    result = result.filter(w => new Date(w.createdAt).getTime() <= to)
  }

  if (filters.sort === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (filters.sort === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    result.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  }

  return result
}

export function applyLogFilters(logs: any[], filters: FilterState): any[] {
  let result = [...logs]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(l =>
      l.title?.toLowerCase().includes(q) ||
      l.content?.replace(/<[^>]*>/g, '').toLowerCase().includes(q)
    )
  }

  if (filters.markerIds.length > 0) {
    result = result.filter(l =>
      filters.markerIds.some(id => l.markers?.some((m: any) => m.id === id))
    )
  }

  if (filters.trailId !== 'all') {
    result = result.filter(l => l.trailId === filters.trailId)
  }

  if (filters.unattached) {
    result = result.filter(l => !l.markers?.length && !l.trailId && !l.waypointId)
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()
    result = result.filter(l => new Date(l.createdAt).getTime() >= from)
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime()
    result = result.filter(l => new Date(l.createdAt).getTime() <= to)
  }

  if (filters.sort === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return result
}

// Prisma query builders
export function buildWaypointWhere(filters: FilterState, wayfarerId: string) {
  const where: any = { wayfarerId }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { url: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.markerIds.length > 0) {
    where.markers = { some: { markerId: { in: filters.markerIds } } }
  }

  if (filters.trailId !== 'all') {
    where.trailId = filters.trailId
  }

  if (filters.readLater) {
    where.readLater = true
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    }
  }

  return where
}

export function buildLogWhere(filters: FilterState, wayfarerId: string) {
  const where: any = { wayfarerId }

  if (filters.search) {
    where.content = { contains: filters.search, mode: 'insensitive' }
  }

  if (filters.markerIds.length > 0) {
    where.markers = { some: { markerId: { in: filters.markerIds } } }
  }

  if (filters.trailId !== 'all') {
    where.trailId = filters.trailId
  }

  if (filters.unattached) {
    where.waypointId = null
    where.trailId = null
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    }
  }

  return where
}

export function buildFolderOrderBy(sort: SortOption) {
  if (sort === 'alpha') return { name: 'asc' as const }
  if (sort === 'oldest') return { createdAt: 'asc' as const }
  return { createdAt: 'desc' as const }
}

export function buildWaypointOrderBy(sort: SortOption) {
  if (sort === 'alpha') return { title: 'asc' as const }
  if (sort === 'oldest') return { createdAt: 'asc' as const }
  return { createdAt: 'desc' as const }
}

export function buildLogOrderBy(sort: SortOption) {
  if (sort === 'oldest') return { createdAt: 'asc' as const }
  return { createdAt: 'desc' as const }
}
