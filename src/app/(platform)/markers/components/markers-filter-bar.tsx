'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'

interface MarkersFilterBarProps {
  search: string
  onSearchChange: (q: string) => void
  /** Current drill-down path segments, e.g. ['AWS', 'Security, Identity, & Compliance'] */
  groupPath: string[]
  /** Called with the number of path segments to keep. 0 = navigate to root. */
  onNavigateTo: (index: number) => void
}

export function MarkersFilterBar({
  search,
  onSearchChange,
  groupPath,
  onNavigateTo,
}: MarkersFilterBarProps) {
  const { terms } = useTerminology()
  const [localSearch, setLocalSearch] = useState(search)
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => {
    if (debouncedSearch !== search) onSearchChange(debouncedSearch)
  }, [debouncedSearch])

  // Sync when cleared externally (e.g. clear filters)
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  // Build breadcrumb items: root + each path segment
  const rootLabel = `All ${terms.markers}`
  const crumbs = [
    { label: rootLabel, index: 0 },
    ...groupPath.map((seg, i) => ({ label: seg, index: i + 1 })),
  ]
  const hasCrumbs = groupPath.length > 0

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">

      {/* ── Search ── */}
      <div className="relative w-full sm:w-auto shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          placeholder={`Search ${terms.markers.toLowerCase()}…`}
          className="pl-8 pr-8 h-8 w-full sm:w-52 text-sm py-0"
        />
        {localSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => { setLocalSearch(''); onSearchChange('') }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* ── Breadcrumb (only when drilled in) ── */}
      {hasCrumbs && (
        <>
          {/* Desktop: inline horizontal */}
          <div className="hidden sm:flex items-center gap-0.5 min-w-0 overflow-hidden">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={i} className="flex items-center gap-0.5 min-w-0 shrink-0">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => !isLast && onNavigateTo(crumb.index)}
                    className={cn(
                      'text-xs truncate max-w-[180px] rounded px-1 py-0.5 transition-colors',
                      isLast
                        ? 'font-medium text-foreground cursor-default'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {crumb.label}
                  </button>
                </span>
              )
            })}
          </div>

          {/* Mobile: stacked full-width buttons, indent inside */}
          <div className="flex flex-col sm:hidden gap-0.5">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !isLast && onNavigateTo(crumb.index)}
                  disabled={isLast}
                  style={{ paddingLeft: `${8 + i * 16}px` }}
                  className={cn(
                    'w-full text-left text-xs rounded py-1.5 pr-3 flex items-center gap-1.5 transition-colors',
                    isLast
                      ? 'font-medium text-foreground bg-muted/40 cursor-default'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className="truncate">{crumb.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
