export type SortOption = 'newest' | 'oldest' | 'alpha'

export interface FilterState {
  search: string
  tagId: string
  folderId: string
  sort: SortOption
  readLater: boolean
  unattached: boolean
  dateFrom: string
  dateTo: string
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  tagId: 'all',
  folderId: 'all',
  sort: 'alpha',
  readLater: false,
  unattached: false,
  dateFrom: '',
  dateTo: '',
}

export function parseFiltersFromParams(params: URLSearchParams): FilterState {
  return {
    search: params.get('search') ?? DEFAULT_FILTERS.search,
    tagId: params.get('tagId') ?? DEFAULT_FILTERS.tagId,
    folderId: params.get('folderId') ?? DEFAULT_FILTERS.folderId,
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
  if (merged.tagId !== 'all') params.set('tagId', merged.tagId)
  if (merged.folderId !== 'all') params.set('folderId', merged.folderId)
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
    filters.tagId !== DEFAULT_FILTERS.tagId ||
    filters.folderId !== DEFAULT_FILTERS.folderId ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.readLater !== DEFAULT_FILTERS.readLater ||
    filters.unattached !== DEFAULT_FILTERS.unattached ||
    filters.dateFrom !== DEFAULT_FILTERS.dateFrom ||
    filters.dateTo !== DEFAULT_FILTERS.dateTo
  )
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

  if (filters.tagId !== 'all') {
    where.tags = { some: { tagId: filters.tagId } }
  }

  if (filters.folderId !== 'all') {
    where.folderId = filters.folderId
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

  if (filters.tagId !== 'all') {
    where.tags = { some: { tagId: filters.tagId } }
  }

  if (filters.folderId !== 'all') {
    where.folderId = filters.folderId
  }

  if (filters.unattached) {
    where.waypointId = null
    where.folderId = null
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