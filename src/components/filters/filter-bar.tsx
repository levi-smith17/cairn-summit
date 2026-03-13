'use client'

import { Bookmark, Unlink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from './search-input'
import { MarkerFilter } from './marker-filter'
import { TrailFilter } from './trail-filter'
import { SortFilter } from './sort-filter'
import { ToggleFilter } from './toggle-filter'
import { DateRangeFilter } from './date-range-filter'
import { useFilters } from '@/hooks/use-filters'
import { hasActiveFilters, SortOption } from '@/lib/filters'
import { useTerminology } from '@/contexts/terminology-context'

interface FilterBarProps {
  markers?: { id: string; name: string; color: string; icon: string | null }[]
  trails?: { id: string; name: string }[]
  showTrailFilter?: boolean
  showMarkerFilter?: boolean
  showSort?: boolean
  showReadLater?: boolean
  showUnattached?: boolean
  showDateRange?: boolean
  sortOptions?: { value: SortOption; label: string }[]
  searchPlaceholder?: string
  fill?: boolean
}

export function FilterBar({
  markers = [],
  trails = [],
  showTrailFilter = false,
  showMarkerFilter = true,
  showSort = true,
  showReadLater = false,
  showUnattached = false,
  showDateRange = false,
  sortOptions,
  searchPlaceholder,
  fill = false,
}: FilterBarProps) {
  const { filters, setFilter, clearFilters } = useFilters()
  const isActive = hasActiveFilters(filters)
  const { terms } = useTerminology()

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${fill ? '[&>*]:grow [&>*]:sm:grow-0' : ''}`}>
      <SearchInput
        value={filters.search}
        onChange={v => setFilter('search', v)}
        placeholder={searchPlaceholder ?? `${terms.explore}...`}
      />

      {showMarkerFilter && (
        <MarkerFilter
          value={filters.tagId}
          onChange={v => setFilter('tagId', v)}
          markers={markers}
        />
      )}

      {showTrailFilter && (
        <TrailFilter
          value={filters.folderId}
          onChange={v => setFilter('folderId', v)}
          trails={trails}
        />
      )}

      {showSort && (
        <SortFilter
          value={filters.sort}
          onChange={v => setFilter('sort', v)}
          options={sortOptions}
        />
      )}

      {showReadLater && (
        <ToggleFilter
          active={filters.readLater}
          onToggle={() => setFilter('readLater', !filters.readLater)}
          label="Read Later"
          icon={<Bookmark className={`h-3.5 w-3.5 ${filters.readLater ? 'fill-current' : ''}`} />}
        />
      )}

      {showUnattached && (
        <ToggleFilter
          active={filters.unattached}
          onToggle={() => setFilter('unattached', !filters.unattached)}
          label="No Trail"
          icon={<Unlink className="h-3.5 w-3.5" />}
        />
      )}

      {showDateRange && (
        <DateRangeFilter
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateFromChange={v => setFilter('dateFrom', v)}
          onDateToChange={v => setFilter('dateTo', v)}
        />
      )}

      {isActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}
