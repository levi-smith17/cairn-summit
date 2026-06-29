'use client'

import { Bookmark, Mail, Unlink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchInput } from './search-input'
import { MarkerFilter } from './marker-filter'
import { TrailFilter } from './trail-filter'
import { SortFilter } from './sort-filter'
import { ToggleFilter } from './toggle-filter'
import { DateRangeFilter } from './date-range-filter'
import { useFilters } from '@/hooks/use-filters'
import { hasActiveFilters, type FilterState, type SortOption } from '@/lib/filters'
import { useTerminology } from '@/contexts/terminology-context'

export interface FilterBarProps {
  markers?: { id: string; name: string; color: string; icon: string | null }[]
  trails?: { id: string; name: string }[]
  showTrailFilter?: boolean
  showMarkerFilter?: boolean
  showSort?: boolean
  showReadLater?: boolean
  showUnattached?: boolean
  showDateRange?: boolean
  showUnreadOnly?: boolean
  sortOptions?: { value: SortOption; label: string }[]
  searchPlaceholder?: string
  fill?: boolean
  trailingAction?: React.ReactNode
}

export interface FilterBarControlsProps extends FilterBarProps {
  layout?: 'inline' | 'stacked'
  mode?: 'all' | 'sheet'
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  showClearButton?: boolean
  onClearFilters?: () => void
}

export function FilterBarControls({
  markers = [],
  trails = [],
  showTrailFilter = false,
  showMarkerFilter = true,
  showSort = true,
  showReadLater = false,
  showUnattached = false,
  showDateRange = false,
  showUnreadOnly = false,
  sortOptions,
  searchPlaceholder,
  layout = 'inline',
  mode = 'all',
  filters,
  setFilter,
  showClearButton = false,
  onClearFilters,
}: FilterBarControlsProps) {
  const { terms } = useTerminology()
  const stacked = layout === 'stacked'
  const wrap = (node: React.ReactNode) =>
    stacked ? <div className="w-full">{node}</div> : node

  return (
    <>
      {mode === 'all' && wrap(
        <SearchInput
          value={filters.search}
          onChange={v => setFilter('search', v)}
          placeholder={searchPlaceholder ?? `${terms.explore}...`}
        />
      )}

      {showMarkerFilter && wrap(
        <MarkerFilter
          value={filters.markerIds}
          onChange={ids => setFilter('markerIds', ids)}
          markers={markers}
        />
      )}

      {showTrailFilter && wrap(
        <TrailFilter
          value={filters.trailId}
          onChange={v => setFilter('trailId', v)}
          trails={trails}
        />
      )}

      {mode === 'all' && showSort && wrap(
        <SortFilter
          value={filters.sort}
          onChange={v => setFilter('sort', v)}
          options={sortOptions}
        />
      )}

      {showReadLater && wrap(
        <ToggleFilter
          active={filters.readLater}
          onToggle={() => setFilter('readLater', !filters.readLater)}
          label="Read Later"
          icon={<Bookmark className={cn('h-3.5 w-3.5', filters.readLater && 'fill-current')} />}
        />
      )}

      {showUnattached && wrap(
        <ToggleFilter
          active={filters.unattached}
          onToggle={() => setFilter('unattached', !filters.unattached)}
          label="No Trail"
          icon={<Unlink className="h-3.5 w-3.5" />}
        />
      )}

      {showUnreadOnly && wrap(
        <ToggleFilter
          active={filters.unreadOnly}
          onToggle={() => setFilter('unreadOnly', !filters.unreadOnly)}
          label="Unread"
          icon={<Mail className="h-3.5 w-3.5" />}
        />
      )}

      {showDateRange && wrap(
        <DateRangeFilter
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateFromChange={v => setFilter('dateFrom', v)}
          onDateToChange={v => setFilter('dateTo', v)}
        />
      )}

      {showClearButton && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={onClearFilters}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </>
  )
}

export function FilterBar({
  fill = false,
  trailingAction,
  ...props
}: FilterBarProps) {
  const { filters, setFilter, clearFilters } = useFilters()
  const isActive = hasActiveFilters(filters)

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${fill ? '[&>*]:grow [&>*]:sm:grow-0' : ''}`}>
      <FilterBarControls
        {...props}
        filters={filters}
        setFilter={setFilter}
        showClearButton={isActive}
        onClearFilters={clearFilters}
      />
      {trailingAction}
    </div>
  )
}
