import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomSelect } from '@/components/ui/custom-select'
import { Plus, Search, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, Wallet, RefreshCw, Copy, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { isInitialRouteLoad, isSectionRefetching } from '@/hooks/use-route-ready'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { ProvisionsSkeleton, ListSectionSkeleton } from '@/components/ui/page-skeleton'
import { BurnRow, type Burn } from './burn-row'
import { InlineBurnForm } from './inline-burn-form'
import { SupplylineRow, type Supplyline } from './supplyline-row'
import { InlineSupplylineForm } from './inline-supplyline-form'
import { CacheRow, type BudgetUtilization } from './cache-row'
import { InlineCacheForm } from './inline-cache-form'
import { carryOverCache, getBurnPage, getSupplylinesFiltered, getSupplylinesSummary } from '@/lib/api/supplylines'
import { getMarkers } from '@/lib/api/markers'
import { extractId } from '@/lib/utils'
import { markerDisplayName } from '@/lib/embedded-markers'

interface Summary {
  monthlySupplylineCost: number
  totalBurn: number
  totalMonthSpend: number
  activeSupplylines: number
}

interface UpcomingRenewal {
  id: string
  name: string
  amount: number
  nextRenewal: string
  billingCycle: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function ProvisionsClient() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['provisions'] })

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [search, setSearch] = useState('')
  const [markerFilter, setMarkerFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const debouncedSearch = useDebounce(search, 300)
  const filtersActive = search !== '' || markerFilter !== 'all' || activeFilter !== 'all'

  const [addingBurn, setAddingBurn] = useState(false)
  const [burnPage, setBurnPage] = useState(1)
  const [addingProvision, setAddingProvision] = useState(false)
  const [addingBudget, setAddingBudget] = useState(false)

  function clearFilters() {
    setSearch('')
    setMarkerFilter('all')
    setActiveFilter('all')
  }

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
    queryKey: ['provisions', 'supplylines', debouncedSearch, markerFilter, activeFilter],
    queryFn: () =>
      getSupplylinesFiltered({
        search: debouncedSearch || undefined,
        markerId: markerFilter !== 'all' ? markerFilter : undefined,
        active: activeFilter !== 'all' ? activeFilter : undefined,
      }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setBurnPage(1)
  }, [month, year, debouncedSearch, markerFilter])

  if (isInitialRouteLoad([markersQuery, summaryQuery, burnQuery, supplylinesQuery])) {
    return <ProvisionsSkeleton title={terms.provisions} />
  }

  const markers = (markersQuery.data ?? []).map((m: { sk: string; name: string; color: string; icon?: string | null }) => ({
    id: extractId(m.sk),
    name: m.name,
    color: m.color,
    icon: m.icon ?? null,
  }))

  const summaryData = summaryQuery.data
  const summary = summaryData?.summary as Summary | undefined
  const upcomingRenewals = (summaryData?.upcomingRenewals ?? []) as UpcomingRenewal[]
  const cacheUtilization = (summaryData?.cacheUtilization ?? []) as BudgetUtilization[]

  const burnItems = (burnQuery.data?.burn ?? []) as Burn[]
  const burnTotal = burnQuery.data?.total ?? 0
  const burnPageSize = burnQuery.data?.pageSize ?? 20
  const supplylines = (supplylinesQuery.data ?? []) as Supplyline[]

  const summaryRefetching = isSectionRefetching([summaryQuery])
  const burnRefetching = isSectionRefetching([burnQuery])
  const supplylinesRefetching = isSectionRefetching([supplylinesQuery])

  const visibleBudgets = markerFilter === 'all'
    ? cacheUtilization
    : cacheUtilization.filter(b => b.markerId === markerFilter)

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const groupedExpenses = burnItems.reduce<Record<string, Burn[]>>((acc, e) => {
    const label = markerDisplayName(e.markers[0])?.split('/').pop() ?? 'Uncategorized'
    if (!acc[label]) acc[label] = []
    acc[label].push(e)
    return acc
  }, {})
  const sortedExpenseGroups = Object.keys(groupedExpenses).sort()
  const groupTotals = sortedExpenseGroups.reduce<Record<string, number>>((acc, label) => {
    acc[label] = groupedExpenses[label].reduce((sum, e) => sum + e.amount, 0)
    return acc
  }, {})

  return (
    <>
      <PlatformHeader title={terms.provisions} />
      <div className="flex flex-col flex-1 gap-4 p-4 min-h-0 overflow-y-auto lg:overflow-hidden">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> {terms.supplylines}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryRefetching ? (
                <>
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{fmt(summary?.monthlySupplylineCost ?? 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{summary?.activeSupplylines ?? 0} active</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> {monthName} {terms.burn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryRefetching ? (
                <>
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-28 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{fmt(summary?.totalBurn ?? 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">recorded this month</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Total Month Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryRefetching ? (
                <>
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{fmt(summary?.totalMonthSpend ?? 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{terms.supplylines.toLowerCase()} + {terms.burn.toLowerCase()}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={upcomingRenewals.length > 0 ? 'border-amber-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Upcoming Renewals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryRefetching ? (
                <>
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{upcomingRenewals.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">within 7 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {upcomingRenewals.length > 0 && !summaryRefetching && (
          <div className="shrink-0 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Upcoming Renewals</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingRenewals.map((r) => {
                const daysUntil = Math.ceil((new Date(r.nextRenewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <Badge key={r.id} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                    {r.name} — {fmt(r.amount)} in {daysUntil}d
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-2 bg-muted/70 rounded-md border border-border h-9 md:h-8 min-w-54 w-full md:w-auto">
              <Button variant="ghost" size="icon" className="h-9 md:h-8 w-9 md:w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-full md:w-36 text-center">{monthName}</span>
              <Button variant="ghost" size="icon" className="h-9 md:h-8 w-9 md:w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative h-9 md:h-8 min-w-48 max-w-112 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`${terms.explore} ${terms.burn.toLowerCase()} & ${terms.supplylines.toLowerCase()}…`}
                className="pl-8 pr-8 h-9 md:h-8 text-sm"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearch('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-1.5 w-full md:w-auto">
              {markers.length > 0 && (
                <div className="w-full md:w-64 shrink-0">
                  <MarkerPicker
                    markers={markers}
                    selected={markerFilter !== 'all' ? [markerFilter] : []}
                    onChange={ids => setMarkerFilter(ids[0] ?? 'all')}
                    singleSelect
                    placeholder={`All ${terms.markers}`}
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
                onChange={setActiveFilter}
                triggerClassName="w-full md:w-28"
              />

              {filtersActive && (
                <Button variant="ghost" size="sm" className="h-9 md:h-8 gap-1.5 text-sm" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:flex-1 gap-4 lg:overflow-hidden lg:min-h-0">

          <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card lg:overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <span className="text-sm font-semibold">{terms.burn}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setAddingBurn((v) => !v)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add {terms.burn}</TooltipContent>
              </Tooltip>
            </div>

            {addingBurn && (
              <div className="shrink-0">
                <InlineBurnForm
                  tags={markers}
                  onSaved={() => { setAddingBurn(false); refresh() }}
                  onCancel={() => setAddingBurn(false)}
                />
              </div>
            )}

            <div className="flex-1 lg:overflow-y-auto">
              {burnRefetching ? (
                <ListSectionSkeleton rows={5} />
              ) : burnItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No {terms.burn.toLowerCase()} found.</div>
              ) : (
                <div className="flex flex-col divide-y">
                  {sortedExpenseGroups.map((label) => (
                    <div key={label}>
                      <div className="lg:sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {label}
                          <span className="ml-2 font-normal normal-case">
                            ({groupedExpenses[label].length})
                          </span>
                        </span>
                        <span className="text-xs font-medium tabular-nums">
                          {fmt(groupTotals[label])}
                        </span>
                      </div>
                      <div className="divide-y">
                        {groupedExpenses[label].map((burn) => (
                          <BurnRow
                            key={burn.id}
                            burn={burn}
                            tags={markers}
                            onSaved={refresh}
                            onDeleted={refresh}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {burnTotal > burnPageSize && (
              <div className="flex items-center justify-between px-4 py-2 border-t shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setBurnPage(p => p - 1)}
                  disabled={burnPage <= 1 || burnRefetching}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {burnPage} / {Math.ceil(burnTotal / burnPageSize)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setBurnPage(p => p + 1)}
                  disabled={burnPage >= Math.ceil(burnTotal / burnPageSize) || burnRefetching}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-112 shrink-0 flex flex-col gap-4">

            <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
                <span className="text-sm font-semibold">{terms.supplylines}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => setAddingProvision((v) => !v)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add {terms.supplylines}</TooltipContent>
                </Tooltip>
              </div>

              {addingProvision && (
                <InlineSupplylineForm
                  tags={markers}
                  onSaved={() => { setAddingProvision(false); refresh() }}
                  onCancel={() => setAddingProvision(false)}
                />
              )}

              <div className="divide-y overflow-y-auto max-h-144">
                {supplylinesRefetching ? (
                  <ListSectionSkeleton rows={4} compact />
                ) : supplylines.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No {terms.supplylines.toLowerCase()} found.</div>
                ) : (
                  supplylines.map((p) => (
                    <SupplylineRow
                      key={p.id}
                      supplyline={p}
                      tags={markers}
                      onSaved={refresh}
                      onDeleted={refresh}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
                <span className="text-sm font-semibold">{terms.cache}</span>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={async () => { await carryOverCache({ month, year }); refresh() }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy from last month</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setAddingBudget((v) => !v)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add {terms.cache}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {addingBudget && (
                <InlineCacheForm
                  markers={markers}
                  month={month}
                  year={year}
                  onSaved={() => { setAddingBudget(false); refresh() }}
                  onCancel={() => setAddingBudget(false)}
                />
              )}

              <div className="divide-y overflow-y-auto max-h-96">
                {summaryRefetching ? (
                  <ListSectionSkeleton rows={3} compact />
                ) : visibleBudgets.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No {terms.cache.toLowerCase()} set for this month.</div>
                ) : (
                  visibleBudgets.map((b) => (
                    <CacheRow
                      key={b.id}
                      cache={b}
                      markers={markers}
                      month={month}
                      year={year}
                      onSaved={refresh}
                      onDeleted={refresh}
                    />
                  ))
                )}
              </div>

              {visibleBudgets.length > 0 && !summaryRefetching && (() => {
                const totalSpent = visibleBudgets.reduce((s, b) => s + b.spent, 0)
                const totalLimit = visibleBudgets.reduce((s, b) => s + b.limit, 0)
                const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
                return (
                  <div className="px-3 py-2 border-t bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Total</span>
                      <span className="text-xs tabular-nums font-medium">
                        {fmt(totalSpent)} <span className="text-muted-foreground font-normal">/ {fmt(totalLimit)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${totalPct >= 100 ? 'bg-destructive' :
                          totalPct >= 80 ? 'bg-amber-500' :
                            'bg-primary'
                          }`}
                        style={{ width: `${Math.min(totalPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{Math.round(totalPct)}% used</span>
                      <span>{fmt(Math.max(totalLimit - totalSpent, 0))} left</span>
                    </div>
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
