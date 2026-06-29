'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { useLocalFilterDraft } from '@/hooks/use-local-filter-draft'

interface Marker {
  id: string
  name: string
  color: string
  icon: string | null
}

interface ProvisionsFilterBarProps {
  monthName: string
  onPrevMonth: () => void
  onNextMonth: () => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  markerFilter: string
  onMarkerFilterChange: (value: string) => void
  activeFilter: string
  onActiveFilterChange: (value: string) => void
  markers: Marker[]
  markersLabel: string
  filtersActive: boolean
  onClearFilters: () => void
}

const DEFAULT_FILTERS = { markerFilter: 'all', activeFilter: 'all' }

export function ProvisionsFilterBar({
  monthName,
  onPrevMonth,
  onNextMonth,
  search,
  onSearchChange,
  searchPlaceholder,
  markerFilter,
  onMarkerFilterChange,
  activeFilter,
  onActiveFilterChange,
  markers,
  markersLabel,
  filtersActive,
  onClearFilters,
}: ProvisionsFilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const applied = { markerFilter, activeFilter }
  const { draft, setDraft } = useLocalFilterDraft(sheetOpen, applied)

  const sheetFilterCount =
    (markerFilter !== 'all' ? 1 : 0) + (activeFilter !== 'all' ? 1 : 0)

  const chips: { id: string; label: string; onRemove: () => void }[] = []
  if (markerFilter !== 'all') {
    const marker = markers.find(m => m.id === markerFilter)
    chips.push({
      id: 'marker',
      label: marker?.name ?? markersLabel,
      onRemove: () => onMarkerFilterChange('all'),
    })
  }
  if (activeFilter !== 'all') {
    chips.push({
      id: 'status',
      label: activeFilter === 'true' ? 'Active' : 'Inactive',
      onRemove: () => onActiveFilterChange('all'),
    })
  }

  function handleApply() {
    onMarkerFilterChange(draft.markerFilter)
    onActiveFilterChange(draft.activeFilter)
    setSheetOpen(false)
  }

  function handleClearAll() {
    onMarkerFilterChange('all')
    onActiveFilterChange('all')
    setDraft({ ...DEFAULT_FILTERS })
    setSheetOpen(false)
  }

  const monthNav = (
    <div className="flex items-center gap-2 bg-muted/70 rounded-md border border-border h-9 md:h-8 min-w-54 w-full md:w-auto">
      <Button variant="ghost" size="icon" className="h-9 md:h-8 w-9 md:w-8" onClick={onPrevMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-full md:w-36 text-center">{monthName}</span>
      <Button variant="ghost" size="icon" className="h-9 md:h-8 w-9 md:w-8" onClick={onNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  const searchInput = (
    <div className="relative h-9 md:h-8 min-w-48 max-w-112 w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="pl-8 pr-8 h-9 md:h-8 text-sm"
      />
      {search && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => onSearchChange('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )

  const markerStatusControls = (
    <>
      {markers.length > 0 && (
        <div className="w-full md:w-64 shrink-0">
          <MarkerPicker
            markers={markers}
            selected={markerFilter !== 'all' ? [markerFilter] : []}
            onChange={ids => onMarkerFilterChange(ids[0] ?? 'all')}
            singleSelect
            placeholder={`All ${markersLabel}`}
            align="start"
            initialPath={['Provisions']}
          />
        </div>
      )}
      <CustomSelect
        options={[
          { value: 'all', label: 'All status' },
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]}
        value={activeFilter}
        onChange={onActiveFilterChange}
        triggerClassName="w-full md:w-28"
      />
      {filtersActive && (
        <Button variant="ghost" size="sm" className="h-9 md:h-8 gap-1.5 text-sm" onClick={onClearFilters}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </>
  )

  return (
    <div className="rounded-lg border border-border bg-card p-2 shrink-0">
      {/* Desktop: single row */}
      <div className="hidden md:flex flex-row flex-wrap items-center gap-1.5">
        {monthNav}
        {searchInput}
        <div className="flex flex-row items-center gap-1.5">{markerStatusControls}</div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        {monthNav}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">{searchInput}</div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 shrink-0"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {sheetFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                {sheetFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {chips.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {chips.map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 shrink-0 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs"
              >
                {chip.label}
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="max-h-[85vh] flex flex-col md:hidden">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
            {markers.length > 0 && (
              <div className="w-full">
                <MarkerPicker
                  markers={markers}
                  selected={draft.markerFilter !== 'all' ? [draft.markerFilter] : []}
                  onChange={ids => setDraft({ ...draft, markerFilter: ids[0] ?? 'all' })}
                  singleSelect
                  placeholder={`All ${markersLabel}`}
                  align="start"
                  initialPath={['Provisions']}
                />
              </div>
            )}
            <CustomSelect
              options={[
                { value: 'all', label: 'All status' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={draft.activeFilter}
              onChange={v => setDraft({ ...draft, activeFilter: v })}
              triggerClassName="w-full"
            />
          </div>
          <DrawerFooter className="shrink-0 border-t flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClearAll}>
              Clear all
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1" onClick={handleApply}>
                Apply
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
