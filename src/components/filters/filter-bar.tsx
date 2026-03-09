'use client'

import { Bookmark, Unlink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from './search-input'
import { TagFilter } from './tag-filter'
import { FolderFilter } from './folder-filter'
import { SortFilter } from './sort-filter'
import { ToggleFilter } from './toggle-filter'
import { DateRangeFilter } from './date-range-filter'
import { useFilters } from '@/hooks/use-filters'
import { hasActiveFilters, SortOption } from '@/lib/filters'

interface FilterBarProps {
  tags?: { id: string; name: string; color: string; icon: string | null }[]
  folders?: { id: string; name: string }[]
  showFolderFilter?: boolean
  showTagFilter?: boolean
  showSort?: boolean
  showReadLater?: boolean
  showUnattached?: boolean
  showDateRange?: boolean
  sortOptions?: { value: SortOption; label: string }[]
  searchPlaceholder?: string
}

export function FilterBar({
  tags = [],
  folders = [],
  showFolderFilter = false,
  showTagFilter = true,
  showSort = true,
  showReadLater = false,
  showUnattached = false,
  showDateRange = false,
  sortOptions,
  searchPlaceholder,
}: FilterBarProps) {
  const { filters, setFilter, setFilters, clearFilters } = useFilters()
  const isActive = hasActiveFilters(filters)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <SearchInput
        value={filters.search}
        onChange={v => setFilter('search', v)}
        placeholder={searchPlaceholder}
      />

      {showTagFilter && (
        <TagFilter
          value={filters.tagId}
          onChange={v => setFilter('tagId', v)}
          tags={tags}
        />
      )}

      {showFolderFilter && (
        <FolderFilter
          value={filters.folderId}
          onChange={v => setFilter('folderId', v)}
          folders={folders}
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
          label="Unattached"
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
          className="h-8 gap-1.5"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}