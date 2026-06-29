import type { FilterState } from '@/lib/filters'
import type { FilterBarProps } from '@/components/filters/filter-bar'

export interface FilterChip {
  id: string
  label: string
  onRemove: () => void
}

export function countSheetFilters(filters: FilterState, config: FilterBarProps): number {
  let count = 0
  if (config.showMarkerFilter !== false && filters.markerIds.length > 0) {
    count += filters.markerIds.length
  }
  if (config.showTrailFilter && filters.trailId !== 'all') count += 1
  if (config.showReadLater && filters.readLater) count += 1
  if (config.showUnattached && filters.unattached) count += 1
  if (config.showUnreadOnly && filters.unreadOnly) count += 1
  if (config.showDateRange && (filters.dateFrom || filters.dateTo)) count += 1
  return count
}

export function deriveFilterChips(
  filters: FilterState,
  config: FilterBarProps,
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void,
  setFilters?: (updates: Partial<FilterState>) => void,
): FilterChip[] {
  const chips: FilterChip[] = []

  if (config.showMarkerFilter !== false) {
    for (const id of filters.markerIds) {
      const marker = config.markers?.find(m => m.id === id)
      chips.push({
        id: `marker-${id}`,
        label: marker?.name ?? 'Marker',
        onRemove: () => setFilter('markerIds', filters.markerIds.filter(m => m !== id)),
      })
    }
  }

  if (config.showTrailFilter && filters.trailId !== 'all') {
    const trail = config.trails?.find(t => t.id === filters.trailId)
    chips.push({
      id: `trail-${filters.trailId}`,
      label: trail?.name ?? 'Trail',
      onRemove: () => setFilter('trailId', 'all'),
    })
  }

  if (config.showReadLater && filters.readLater) {
    chips.push({
      id: 'readLater',
      label: 'Read Later',
      onRemove: () => setFilter('readLater', false),
    })
  }

  if (config.showUnattached && filters.unattached) {
    chips.push({
      id: 'unattached',
      label: 'No Trail',
      onRemove: () => setFilter('unattached', false),
    })
  }

  if (config.showUnreadOnly && filters.unreadOnly) {
    chips.push({
      id: 'unreadOnly',
      label: 'Unread',
      onRemove: () => setFilter('unreadOnly', false),
    })
  }

  if (config.showDateRange && (filters.dateFrom || filters.dateTo)) {
    const from = filters.dateFrom
      ? new Date(filters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '…'
    const to = filters.dateTo
      ? new Date(filters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '…'
    chips.push({
      id: 'dateRange',
      label: `${from} – ${to}`,
      onRemove: () => {
        if (setFilters) setFilters({ dateFrom: '', dateTo: '' })
        else {
          setFilter('dateFrom', '')
          setFilter('dateTo', '')
        }
      },
    })
  }

  return chips
}
