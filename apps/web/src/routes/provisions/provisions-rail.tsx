import { Plus, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { MarkerBadge } from '@/routes/waypoints/marker-badge'
import { toDisplayMarker } from '@/lib/embedded-markers'
import { toggleSupplylineActive } from '@/lib/api/supplylines'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'
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

export function ProvisionsRail({
  supplylines,
  selectedId,
  activeFilter,
  onActiveFilterChange,
  onSelect,
  onAdd,
  onOpenCatalog,
  onRefresh,
}: {
  supplylines: Supplyline[]
  selectedId: string | null
  activeFilter: string
  onActiveFilterChange: (value: string) => void
  onSelect: (id: string) => void
  onAdd: () => void
  onOpenCatalog: () => void
  onRefresh: () => void
}) {
  const { terms } = useTerminology()
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">{terms.supplylines}</span>
        <div className="flex items-center gap-1">
          <ToolbarTooltip label={`${terms.trails} & ${terms.markers}`}>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              onClick={onOpenCatalog}
              aria-label={`${terms.trails} & ${terms.markers}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label={`Add ${terms.supplyline}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onAdd}
              aria-label={`Add ${terms.supplyline}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ToolbarTooltip>
        </div>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-2">
        <CustomSelect
          value={activeFilter}
          onChange={onActiveFilterChange}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
            { value: 'all', label: 'All status' },
          ]}
          triggerClassName="w-full"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {supplylines.length === 0 ? (
          <p className="px-1 py-4 text-xs text-muted-foreground">
            No {terms.supplylines.toLowerCase()} match this filter.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {supplylines.map((supplyline) => (
              <li key={supplyline.id}>
                <ProvisionsRailCard
                  supplyline={supplyline}
                  selected={selectedId === supplyline.id}
                  onSelect={() => onSelect(supplyline.id)}
                  onToggleActive={onRefresh}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProvisionsRailCard({
  supplyline,
  selected,
  onSelect,
  onToggleActive,
}: {
  supplyline: Supplyline
  selected: boolean
  onSelect: () => void
  onToggleActive: () => void
}) {
  const daysUntil = Math.ceil(
    (new Date(supplyline.nextRenewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  const renewingSoon = daysUntil <= 7 && supplyline.active
  const renewalDate = new Date(supplyline.nextRenewal)

  return (
    <div
      data-inspectable
      className={cn(
        'flex w-full items-start gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
        selected ? 'border-[oklch(0.45_0.1_127)] bg-primary/10 dark:border-header' : 'border-border hover:border-[oklch(0.45_0.1_127)] dark:hover:border-header',
        !supplyline.active && 'opacity-50',
      )}
    >
      <Switch
        checked={supplyline.active}
        onCheckedChange={async (checked) => {
          await toggleSupplylineActive(supplyline.id, checked)
          onToggleActive()
        }}
        className="mt-0.5 shrink-0 scale-75"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">{supplyline.name}</span>
          {renewingSoon ? (
            <Badge className="border-amber-500/30 bg-amber-500/10 px-1 py-0 text-[10px] text-amber-700 dark:text-amber-400">
              {daysUntil}d
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {supplyline.markers.map((entry, i) => {
            const marker = toDisplayMarker(entry)
            if (!marker) return null
            return <MarkerBadge key={marker.id ?? i} marker={marker} />
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-muted-foreground">
          <span>
            {renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {fmt(supplyline.amount)}
            <span className="font-normal text-muted-foreground">
              {' '}
              / {CYCLE_LABELS[supplyline.billingCycle] ?? supplyline.billingCycle}
            </span>
          </span>
        </div>
      </button>
    </div>
  )
}
