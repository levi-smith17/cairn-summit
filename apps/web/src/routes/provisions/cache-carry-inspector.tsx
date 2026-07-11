import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { InspectorChrome, InspectorChromeTitle } from '@/components/studio/ui/inspector-chrome'
import { getSupplylinesSummary } from '@/lib/api/supplylines'
import {
  carryOverCacheToMonth,
  carrySelectedCacheToMonth,
  monthYearLabel,
  shiftMonth,
} from '@/lib/cache-carry-over'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'
import type { ProvisionsMarker } from './provisions-types'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

type SourceCacheItem = {
  id: string
  markerId: string
  limit: number
  spent: number
  marker?: { id: string; name: string; color: string }
}

function markerShortLabel(
  markerId: string,
  markers: ProvisionsMarker[],
  item?: SourceCacheItem,
): string {
  const fromList = markers.find((m) => m.id === markerId)?.name
  const name = fromList ?? item?.marker?.name
  if (!name || name === 'Uncategorized') return 'Uncategorized'
  return name.split('/').pop() ?? name
}

export function CacheCarryInspector({
  targetMonth,
  targetYear,
  targetMarkerIds,
  markers,
  onComplete,
}: {
  targetMonth: number
  targetYear: number
  targetMarkerIds: Set<string>
  markers: ProvisionsMarker[]
  onComplete: () => void
}) {
  const { terms } = useTerminology()
  const defaultSource = shiftMonth(targetMonth, targetYear, -1)
  const [sourceMonth, setSourceMonth] = useState(defaultSource.month)
  const [sourceYear, setSourceYear] = useState(defaultSource.year)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [carrying, setCarrying] = useState(false)

  const sourceQuery = useQuery({
    queryKey: ['provisions', 'cache-carry-source', sourceMonth, sourceYear],
    queryFn: () => getSupplylinesSummary(sourceMonth, sourceYear),
  })

  const sourceItems = (sourceQuery.data?.cacheUtilization ?? []) as SourceCacheItem[]

  const selectableItems = useMemo(
    () => sourceItems.filter((item) => !targetMarkerIds.has(item.markerId)),
    [sourceItems, targetMarkerIds],
  )

  function toggleItem(markerId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(markerId)) next.delete(markerId)
      else next.add(markerId)
      return next
    })
  }

  function selectAllSelectable() {
    setSelected(new Set(selectableItems.map((item) => item.markerId)))
  }

  async function handleCarrySelected() {
    const items = sourceItems
      .filter((item) => selected.has(item.markerId))
      .map((item) => ({ markerId: item.markerId, limit: item.limit }))
    if (items.length === 0) return

    setCarrying(true)
    try {
      const result = await carrySelectedCacheToMonth(targetMonth, targetYear, items)
      const sourceName = monthYearLabel(sourceMonth, sourceYear)
      if (result.created > 0) {
        toast.success(
          `Brought ${result.created} ${terms.cache.toLowerCase()} from ${sourceName}${
            result.skipped > 0 ? ` (${result.skipped} skipped)` : ''
          }`,
        )
      } else {
        toast.message(`No new ${terms.cache.toLowerCase()} to bring forward`)
      }
      onComplete()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to bring ${terms.cache} forward`)
    } finally {
      setCarrying(false)
    }
  }

  async function handleQuickCarry() {
    setCarrying(true)
    try {
      const result = await carryOverCacheToMonth(targetMonth, targetYear)
      if (!result) {
        toast.message(`No previous ${terms.cache.toLowerCase()} available`)
        return
      }
      const sourceName = monthYearLabel(result.sourceMonth, result.sourceYear)
      toast.success(`Copied ${result.count} ${terms.cache.toLowerCase()} from ${sourceName}`)
      onComplete()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to copy ${terms.cache}`)
    } finally {
      setCarrying(false)
    }
  }

  const sourceName = monthYearLabel(sourceMonth, sourceYear)
  const targetName = monthYearLabel(targetMonth, targetYear)

  useEffect(() => {
    setSelected(new Set())
  }, [sourceMonth, sourceYear])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={terms.cache} title="Bring forward" />
      </InspectorChrome>

      <p className="shrink-0 border-b border-border px-5 py-3 text-xs text-muted-foreground">
        Select entries from a source month to copy into {targetName}.
      </p>

      <div className="shrink-0 space-y-2 border-b border-border px-5 py-3">
        <div className="flex h-8 w-full items-center gap-0.5 rounded-md border border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              const prev = shiftMonth(sourceMonth, sourceYear, -1)
              setSourceMonth(prev.month)
              setSourceYear(prev.year)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-0 flex-1 text-center text-sm font-medium">{sourceName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              const next = shiftMonth(sourceMonth, sourceYear, 1)
              setSourceMonth(next.month)
              setSourceYear(next.year)
            }}
            disabled={
              sourceYear > targetYear || (sourceYear === targetYear && sourceMonth >= targetMonth)
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="outline" className="h-8 w-full text-xs" onClick={selectAllSelectable}>
          Select all
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sourceQuery.isLoading ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : sourceItems.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No {terms.cache.toLowerCase()} in {sourceName}.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sourceItems.map((item) => {
              const alreadyPresent = targetMarkerIds.has(item.markerId)
              const label = markerShortLabel(item.markerId, markers, item)
              const checked = selected.has(item.markerId)

              return (
                <li key={item.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-5 py-3',
                      alreadyPresent ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={checked}
                      disabled={alreadyPresent || carrying}
                      onChange={() => toggleItem(item.markerId)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        Limit {fmt(item.limit)}
                        {alreadyPresent ? ' · already in target month' : ''}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {fmt(item.spent)} spent
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          type="button"
          className="w-full"
          onClick={handleCarrySelected}
          disabled={carrying || selected.size === 0}
        >
          {carrying ? 'Bringing…' : `Bring ${selected.size} selected`}
        </Button>
      </div>
      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleQuickCarry}
          disabled={carrying}
        >
          Carry all from previous month
        </Button>
      </div>
    </div>
  )
}
