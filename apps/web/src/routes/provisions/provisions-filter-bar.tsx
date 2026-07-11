import { useState } from 'react'
import { Copy } from 'lucide-react'
import { ContextBarSearch } from '@/components/studio/layout/context-bar-search'
import {
  FilterPaletteField,
  FilterPaletteStack,
} from '@/components/studio/layout/filter-palette-field'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/studio/layout/studio-data-toolbar'
import { StudioPagination } from '@/components/studio/ui/studio-pagination'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'
import type { ProvisionsMarker } from './provisions-types'

export function ProvisionsFilterBar({
  monthName,
  onPrevMonth,
  onNextMonth,
  search,
  onSearchChange,
  markerFilter,
  onMarkerFilterChange,
  markers,
  filtersActive,
  onClearFilters,
  onBringCache,
}: {
  monthName: string
  onPrevMonth: () => void
  onNextMonth: () => void
  search: string
  onSearchChange: (value: string) => void
  markerFilter: string
  onMarkerFilterChange: (value: string) => void
  markers: ProvisionsMarker[]
  filtersActive: boolean
  onClearFilters: () => void
  onBringCache: () => void
}) {
  const { terms } = useTerminology()
  const [searchExpanded, setSearchExpanded] = useState(
    () => search.trim().length > 0 || markerFilter !== 'all',
  )

  return (
    <div className={cn(STUDIO_CONTEXT_BAR_CLASS)}>
      <div className="flex w-full min-w-0 items-center gap-2">
        <span className="shrink-0 text-sm font-semibold text-foreground">{terms.burn}</span>
        <StudioPagination
          className="shrink-0"
          aria-label="Month"
          label={monthName}
          onPrev={onPrevMonth}
          onNext={onNextMonth}
          canGoPrev
          canGoNext
          prevLabel="Previous month"
          nextLabel="Next month"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ContextBarSearch
            expanded={searchExpanded}
            onExpandedChange={setSearchExpanded}
            query={search}
            onQueryChange={onSearchChange}
            placeholder={`Filter ${terms.burn}…`}
            tooltipLabel={`Filter ${terms.burn}`}
            triggerIcon="filter"
            active={filtersActive}
            onClearAll={onClearFilters}
            expandedPanel={
              markers.length > 0 ? (
                <FilterPaletteStack>
                  <FilterPaletteField label={terms.markers.slice(0, -1) || terms.markers}>
                    <MarkerPicker
                      markers={markers}
                      selected={markerFilter !== 'all' ? [markerFilter] : []}
                      onChange={(ids) => onMarkerFilterChange(ids[0] ?? 'all')}
                      singleSelect
                      placeholder={`All ${terms.markers}`}
                      initialPath={['Provisions']}
                    />
                  </FilterPaletteField>
                </FilterPaletteStack>
              ) : undefined
            }
          />
          <ToolbarTooltip label={`Bring ${terms.cache} Forward`}>
            <button
              type="button"
              onClick={onBringCache}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Bring ${terms.cache} forward`}
            >
              <Copy className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
        </div>
      </div>
    </div>
  )
}
