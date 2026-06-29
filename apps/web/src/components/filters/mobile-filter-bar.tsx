'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { SearchInput } from './search-input'
import { SortFilter } from './sort-filter'
import { FilterBar, FilterBarControls, type FilterBarProps } from './filter-bar'
import { useFilters } from '@/hooks/use-filters'
import { useFilterDraft } from '@/hooks/use-filter-draft'
import { countSheetFilters, deriveFilterChips } from '@/lib/filter-chips'
import { useTerminology } from '@/contexts/terminology-context'

export function MobileFilterBar({ fill = false, trailingAction, ...props }: FilterBarProps) {
  const { terms } = useTerminology()
  const { filters, setFilter, setFilters, clearFilters } = useFilters()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { draft, setDraftFilter, applyDraft, clearDraft } = useFilterDraft(
    sheetOpen,
    filters,
    setFilters,
    clearFilters,
  )

  const sheetFilterCount = countSheetFilters(filters, props)
  const chips = deriveFilterChips(filters, props, setFilter, setFilters)

  function handleApply() {
    applyDraft()
    setSheetOpen(false)
  }

  function handleClearAll() {
    clearDraft()
    setSheetOpen(false)
  }

  return (
    <>
      {/* Desktop: unchanged */}
      <div className="hidden md:contents">
        <FilterBar fill={fill} trailingAction={trailingAction} {...props} />
      </div>

      {/* Mobile: compact row + chips + sheet */}
      <div className="flex flex-col gap-2 md:hidden w-full">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={filters.search}
              onChange={v => setFilter('search', v)}
              placeholder={props.searchPlaceholder ?? `${terms.explore}...`}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 shrink-0"
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

          {props.showSort !== false && (
            <div className="shrink-0 w-28">
              <SortFilter
                value={filters.sort}
                onChange={v => setFilter('sort', v)}
                options={props.sortOptions}
              />
            </div>
          )}

          {trailingAction}
        </div>

        {chips.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
            {chips.map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 shrink-0 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs text-foreground"
              >
                {chip.label}
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
            <FilterBarControls
              {...props}
              mode="sheet"
              layout="stacked"
              filters={draft}
              setFilter={setDraftFilter}
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
    </>
  )
}
