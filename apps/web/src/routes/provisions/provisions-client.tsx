import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Wallet, RefreshCw, TrendingUp } from 'lucide-react'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { ContextBarAddButton } from '@/components/studio/ui/context-bar-add-button'
import { StudioPagination } from '@/components/studio/ui/studio-pagination'
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { useTerminology } from '@/contexts/terminology-context'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { isInitialRouteLoad, isSectionRefetching } from '@/hooks/use-route-ready'
import { ListSectionSkeleton } from '@/components/ui/page-skeleton'
import { ProvisionsStudioSkeleton } from '@/components/studio/ui/studio-skeletons'
import { SelectableBurnRow, BurnGroupHeaderActions } from './selectable-burn-row'
import { ProvisionsRail } from './provisions-rail'
import { ProvisionsInspector } from './provisions-inspector'
import { ProvisionsFilterBar } from './provisions-filter-bar'
import type { Burn } from './burn-row'
import type { Supplyline } from './supplyline-row'
import type { BudgetUtilization } from './cache-row'
import type { ProvisionsSelection } from './provisions-types'
import { getBurnPage, getSupplylinesFiltered, getSupplylinesSummary } from '@/lib/api/supplylines'
import { getMarkers } from '@/lib/api/markers'
import {
  effectiveCacheSpent,
  effectiveCacheUtilization,
  totalEffectiveCacheUtilization,
} from '@/lib/cache-supplyline'
import {
  buildBurnCanvasGroups,
  cacheUtilizationColor,
  canvasMarkerLabel,
} from '@/lib/provisions-format'
import { extractId, cn } from '@/lib/utils'

interface Summary {
  monthlySupplylineCost: number
  totalBurn: number
  totalMonthSpend: number
  activeSupplylines: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function ProvisionsClient() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const queryClient = useQueryClient()
  const { pinned: inspectorPinned } = useInspectorPin()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['provisions'] })

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [search, setSearch] = useState('')
  const [markerFilter, setMarkerFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('true')
  const debouncedSearch = useDebounce(search, 300)
  const surtrFiltersActive = search !== '' || markerFilter !== 'all'

  const [selection, setSelection] = useState<ProvisionsSelection | null>(null)
  const [burnPage, setBurnPage] = useState(1)

  const markersQuery = useQuery({
    queryKey: ['markers', user?.id],
    queryFn: getMarkers,
    enabled: !!user,
  })

  const summaryQuery = useQuery({
    queryKey: ['provisions', 'summary', month, year],
    queryFn: () => getSupplylinesSummary(month, year),
    enabled: !!user,
    placeholderData: keepPreviousData,
  })

  const burnQuery = useQuery({
    queryKey: ['provisions', 'burn', month, year, burnPage, debouncedSearch, markerFilter],
    queryFn: () =>
      getBurnPage({
        month,
        year,
        page: burnPage,
        search: debouncedSearch || undefined,
        markerId: markerFilter !== 'all' ? markerFilter : undefined,
      }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  })

  const supplylinesQuery = useQuery({
    queryKey: ['provisions', 'supplylines', activeFilter],
    queryFn: () =>
      getSupplylinesFiltered({
        active: activeFilter !== 'all' ? activeFilter : undefined,
      }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  })

  /** Active supplylines only — used for cache utilization (independent of rail filter). */
  const cacheSupplylinesQuery = useQuery({
    queryKey: ['provisions', 'supplylines-cache'],
    queryFn: () => getSupplylinesFiltered({ active: 'true' }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setBurnPage(1)
  }, [month, year, debouncedSearch, markerFilter])

  const clearSelection = useCallback(() => setSelection(null), [])

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (inspectorPinned || selection == null) return
      const target = event.target as HTMLElement
      if (target.closest('[data-inspectable]')) return
      clearSelection()
    },
    [inspectorPinned, selection, clearSelection],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && selection) {
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, selection, clearSelection])

  const markers = useMemo(
    () =>
      (markersQuery.data ?? []).map((m: { sk: string; name: string; color: string; icon?: string | null }) => ({
        id: extractId(m.sk),
        name: m.name,
        color: m.color,
        icon: m.icon ?? null,
      })),
    [markersQuery.data],
  )

  const summaryData = summaryQuery.data
  const summary = summaryData?.summary as Summary | undefined
  const cacheUtilization = (summaryData?.cacheUtilization ?? []) as BudgetUtilization[]

  const burnItems = (burnQuery.data?.burn ?? []) as Burn[]
  const burnTotal = burnQuery.data?.total ?? 0
  const burnPageSize = burnQuery.data?.pageSize ?? 20

  const supplylines = useMemo(
    () =>
      [...((supplylinesQuery.data ?? []) as Supplyline[])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [supplylinesQuery.data],
  )

  const cacheSupplylines = (cacheSupplylinesQuery.data ?? []) as Supplyline[]

  const cacheByMarkerId = useMemo(
    () => new Map(cacheUtilization.map((c) => [c.markerId, c])),
    [cacheUtilization],
  )

  const targetMarkerIds = useMemo(
    () => new Set(cacheUtilization.map((c) => c.markerId)),
    [cacheUtilization],
  )

  const canvasGroups = useMemo(
    () =>
      buildBurnCanvasGroups(burnItems, cacheUtilization, markers).filter(
        (group) => markerFilter === 'all' || group.markerId === markerFilter,
      ),
    [burnItems, cacheUtilization, markers, markerFilter],
  )

  const cacheUtilizationPct = useMemo(
    () => totalEffectiveCacheUtilization(cacheUtilization, cacheSupplylines),
    [cacheUtilization, cacheSupplylines],
  )

  const selectedBurn =
    selection?.kind === 'burn' ? burnItems.find((b) => b.id === selection.id) : undefined
  const selectedSupplyline =
    selection?.kind === 'supplyline'
      ? supplylines.find((s) => s.id === selection.id)
      : undefined
  const selectedCache =
    selection?.kind === 'cache'
      ? cacheUtilization.find((c) => c.id === selection.id)
      : selection?.kind === 'cache-marker'
        ? cacheByMarkerId.get(selection.markerId)
        : undefined

  const selectedCacheMarkerId =
    selection?.kind === 'cache'
      ? selectedCache?.markerId
      : selection?.kind === 'cache-marker'
        ? selection.markerId
        : null

  const cacheBurnsQuery = useQuery({
    queryKey: ['provisions', 'burn', 'cache-marker', month, year, selectedCacheMarkerId],
    queryFn: () =>
      getBurnPage({
        month,
        year,
        page: 1,
        markerId: selectedCacheMarkerId!,
      }),
    enabled: !!user && Boolean(selectedCacheMarkerId),
    placeholderData: keepPreviousData,
  })

  const cacheMarkerBurns = useMemo(
    () =>
      [...((cacheBurnsQuery.data?.burn ?? []) as Burn[])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [cacheBurnsQuery.data?.burn],
  )

  if (isInitialRouteLoad([markersQuery, summaryQuery, burnQuery, supplylinesQuery])) {
    return <ProvisionsStudioSkeleton />
  }

  const burnRefetching = isSectionRefetching([burnQuery])
  const supplylinesRefetching = isSectionRefetching([supplylinesQuery])

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else setMonth(month + 1)
  }
  const monthName = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  const inspectorOpen = inspectorPinned || selection != null
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  const selectedSupplylineId = selection?.kind === 'supplyline' ? selection.id : null
  const selectedBurnId = selection?.kind === 'burn' ? selection.id : null

  const emptyCacheMessage = `No ${terms.burn.toLowerCase()} in this ${terms.cache.toLowerCase()} yet.`
  const burnTotalPages = Math.max(1, Math.ceil(burnTotal / burnPageSize))

  return (
    <StudioLayout
      railLabel={terms.supplylines}
      contextBar={
        <PlatformStudioContextBar
          aria-label={`${terms.provisions} header`}
          title={terms.provisions}
          subtitle={monthName}
          showInspectorPin
          metadata={
            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {fmt(summary?.monthlySupplylineCost ?? 0)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {fmt(summary?.totalBurn ?? 0)}
              </span>
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {fmt(summary?.totalMonthSpend ?? 0)}
              </span>
              {cacheUtilizationPct != null ? (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    cacheUtilizationPct >= 100
                      ? 'bg-destructive/15 text-destructive'
                      : cacheUtilizationPct >= 80
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {Math.round(cacheUtilizationPct)}% {terms.cache.toLowerCase()}
                </span>
              ) : null}
            </div>
          }
          actions={
            <ContextBarAddButton
              label={`Add ${terms.burn}`}
              onClick={() => setSelection({ kind: 'new-burn' })}
            />
          }
        />
      }
      rail={
        supplylinesRefetching && supplylines.length === 0 ? (
          <div className="p-3">
            <ListSectionSkeleton rows={6} compact />
          </div>
        ) : (
          <ProvisionsRail
            supplylines={supplylines}
            selectedId={selectedSupplylineId}
            activeFilter={activeFilter}
            onActiveFilterChange={setActiveFilter}
            onSelect={(id) => setSelection({ kind: 'supplyline', id })}
            onAdd={() => setSelection({ kind: 'new-supplyline' })}
            onOpenCatalog={() => setSelection({ kind: 'catalog' })}
            onRefresh={refresh}
          />
        )
      }
      canvas={
        <div className="flex h-full min-h-0 flex-col" onPointerDown={handleCanvasPointerDown}>
          <ProvisionsFilterBar
            monthName={monthName}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            search={search}
            onSearchChange={setSearch}
            markerFilter={markerFilter}
            onMarkerFilterChange={setMarkerFilter}
            markers={markers}
            filtersActive={surtrFiltersActive}
            onClearFilters={() => {
              setSearch('')
              setMarkerFilter('all')
            }}
            onBringCache={() => setSelection({ kind: 'cache-carry' })}
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {burnRefetching && burnItems.length === 0 ? (
              <ListSectionSkeleton rows={8} />
            ) : canvasGroups.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground sm:px-6">
                No {terms.cache.toLowerCase()} or {terms.burn.toLowerCase()} found.
              </div>
            ) : (
              <div className="flex flex-col">
                {canvasGroups.map(({ markerId, burns: groupBurns, cache }) => {
                  const groupTotal = groupBurns.reduce((sum, b) => sum + b.amount, 0)
                  const label = canvasMarkerLabel(markerId, markers, cache)
                  const spent = cache ? effectiveCacheSpent(cache, cacheSupplylines) : 0
                  const pct = cache ? effectiveCacheUtilization(cache, cacheSupplylines) : 0
                  const hasCache = cache != null

                  return (
                    <div key={markerId}>
                      <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-border bg-muted/90 px-4 py-2 backdrop-blur-sm sm:px-6">
                        <button
                          type="button"
                          data-inspectable
                          onClick={() => {
                            if (cache) setSelection({ kind: 'cache', id: cache.id })
                            else if (markerId !== 'uncategorized')
                              setSelection({ kind: 'cache-marker', markerId })
                            else setSelection({ kind: 'new-cache' })
                          }}
                          className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {label}
                              {groupBurns.length > 0 ? (
                                <span className="ml-2 font-normal normal-case">
                                  ({groupBurns.length})
                                </span>
                              ) : null}
                            </span>
                            <div className="flex shrink-0 items-center gap-3">
                              {hasCache ? (
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {fmt(spent)}{' '}
                                  <span className="text-muted-foreground/70">
                                    / {fmt(cache.limit)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No {terms.cache.toLowerCase()}
                                </span>
                              )}
                              <span className="text-xs font-medium tabular-nums">
                                {fmt(groupTotal)}
                              </span>
                            </div>
                          </div>
                          {hasCache ? (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    cacheUtilizationColor(pct),
                                  )}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                {Math.round(pct)}%
                              </span>
                            </div>
                          ) : null}
                        </button>
                        <BurnGroupHeaderActions
                          label={`Add ${terms.burn}`}
                          onAdd={() =>
                            setSelection({
                              kind: 'new-burn',
                              markerId: markerId === 'uncategorized' ? undefined : markerId,
                            })
                          }
                        />
                      </div>
                      {groupBurns.length > 0 ? (
                        <div className="divide-y divide-border">
                          {groupBurns.map((burn) => (
                            <SelectableBurnRow
                              key={burn.id}
                              burn={burn}
                              selected={selectedBurnId === burn.id}
                              onSelect={() => setSelection({ kind: 'burn', id: burn.id })}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="border-b border-border px-4 py-4 text-xs text-muted-foreground sm:px-6">
                          {emptyCacheMessage}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {burnTotal > burnPageSize ? (
            <div className="flex shrink-0 items-center justify-center border-t border-border px-4 py-2 sm:px-6">
              <StudioPagination
                aria-label={`${terms.burn} pagination`}
                label={`${burnPage} / ${burnTotalPages}`}
                onPrev={() => setBurnPage((p) => p - 1)}
                onNext={() => setBurnPage((p) => p + 1)}
                canGoPrev={burnPage > 1 && !burnRefetching}
                canGoNext={burnPage < burnTotalPages && !burnRefetching}
              />
            </div>
          ) : null}
        </div>
      }
      inspectorState={inspectorState}
      inspectorHint={`Select ${terms.burn.toLowerCase()}, ${terms.supplylines.toLowerCase()}, or ${terms.cache.toLowerCase()} to inspect`}
      inspector={
        selection ? (
          <ProvisionsInspector
            selection={selection}
            markers={markers}
            month={month}
            year={year}
            burn={selectedBurn}
            supplyline={selectedSupplyline}
            cache={selectedCache}
            cacheSupplylines={cacheSupplylines}
            cacheMarkerBurns={cacheMarkerBurns}
            targetMarkerIds={targetMarkerIds}
            onSaved={() => {
              refresh()
              if (
                selection.kind === 'new-burn' ||
                selection.kind === 'new-supplyline' ||
                selection.kind === 'new-cache' ||
                selection.kind === 'cache-marker' ||
                selection.kind === 'cache-carry'
              ) {
                clearSelection()
              }
            }}
            onDeleted={() => {
              refresh()
              clearSelection()
            }}
            onCancel={clearSelection}
          />
        ) : inspectorPinned ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inspector
              </p>
            </div>
            <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
              Select {terms.burn.toLowerCase()}, {terms.supplylines.toLowerCase()}, or{' '}
              {terms.cache.toLowerCase()} to edit.
            </p>
          </div>
        ) : null
      }
    />
  )
}
