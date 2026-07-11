import { MarkerBadge } from '@/routes/waypoints/marker-badge'
import { toDisplayMarker, toMarkerId } from '@/lib/embedded-markers'
import { cacheUtilizationColor } from '@/lib/provisions-format'
import {
  effectiveCacheSpent,
  effectiveCacheUtilization,
  supplylineCountsAgainstCache,
  supplylineMonthlyAmount,
  supplylineSpendForMarker,
} from '@/lib/cache-supplyline'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'
import type { Burn } from './burn-row'
import type { BudgetUtilization } from './cache-row'
import type { Supplyline } from './supplyline-row'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function CacheAllocationPanel({
  cache,
  burns,
  supplylines,
}: {
  cache: BudgetUtilization
  burns: Burn[]
  supplylines: Supplyline[]
}) {
  const { terms } = useTerminology()
  const matchingSupplylines = supplylines.filter(
    (line) =>
      line.active &&
      supplylineCountsAgainstCache(line.billingCycle) &&
      line.markers.some((entry) => toMarkerId(entry) === cache.markerId),
  )
  const burnSpend = cache.spent
  const lineSpend = supplylineSpendForMarker(supplylines, cache.markerId)
  const totalSpent = effectiveCacheSpent(cache, supplylines)
  const utilization = effectiveCacheUtilization(cache, supplylines)

  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Allocation
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">{terms.burn}</span>
          <span className="text-right tabular-nums text-foreground">{fmt(burnSpend)}</span>
          <span className="text-muted-foreground">{terms.supplylines}</span>
          <span className="text-right tabular-nums text-foreground">{fmt(lineSpend)}</span>
          <span className="font-medium text-foreground">Total</span>
          <span className="text-right font-medium tabular-nums text-foreground">
            {fmt(totalSpent)}
          </span>
          <span className="text-muted-foreground">Limit</span>
          <span className="text-right tabular-nums text-foreground">{fmt(cache.limit)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', cacheUtilizationColor(utilization))}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {Math.round(utilization)}%
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {terms.burn}
        </p>
        {burns.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No {terms.burn.toLowerCase()} charged to this {terms.cache.toLowerCase()} this month.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {burns.map((burn) => (
              <li
                key={burn.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{burn.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(burn.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{fmt(burn.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {terms.supplylines}
        </p>
        {matchingSupplylines.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active {terms.supplylines.toLowerCase()} counting toward this{' '}
            {terms.cache.toLowerCase()}.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {matchingSupplylines.map((line) => (
              <li
                key={line.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{line.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {line.markers.map((entry, index) => {
                      const marker = toDisplayMarker(entry)
                      if (!marker) return null
                      return <MarkerBadge key={marker.id ?? index} marker={marker} />
                    })}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {fmt(supplylineMonthlyAmount(line.amount, line.billingCycle))} / mo
                    <span className="text-muted-foreground/70">
                      {' '}
                      ({CYCLE_LABELS[line.billingCycle] ?? line.billingCycle})
                    </span>
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {fmt(line.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
