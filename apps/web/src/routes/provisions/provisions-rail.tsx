import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  filtersActive,
  onClearFilters,
  onSelect,
  onAdd,
  onRefresh,
}: {
  supplylines: Supplyline[]
  selectedId: string | null
  activeFilter: string
  onActiveFilterChange: (value: string) => void
  filtersActive: boolean
  onClearFilters: () => void
  onSelect: (id: string) => void
  onAdd: () => void
  onRefresh: () => void
}) {
  const { terms } = useTerminology()
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">{terms.supplylines}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onAdd}
              aria-label={`Add ${terms.supplylines.toLowerCase()}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add {terms.supplylines}</TooltipContent>
        </Tooltip>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <CustomSelect
            value={activeFilter}
            onChange={onActiveFilterChange}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
              { value: 'all', label: 'All status' },
            ]}
            triggerClassName="min-w-0 flex-1"
          />
          {filtersActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2 text-xs"
              onClick={onClearFilters}
            >
              Reset
            </Button>
          ) : null}
        </div>
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

  return (
    <div
      data-inspectable
      className={cn(
        'flex items-start gap-2 rounded-md border border-transparent px-2 py-2 transition-colors',
        selected ? 'border-primary/30 bg-primary/10' : 'hover:bg-muted-hover',
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
      />
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{supplyline.name}</span>
          {renewingSoon ? (
            <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-400">
              {daysUntil}d
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">{fmt(supplyline.amount)}</span>
          <span>·</span>
          <span>{CYCLE_LABELS[supplyline.billingCycle] ?? supplyline.billingCycle}</span>
          {supplyline.markers.map((entry, i) => {
            const marker = toDisplayMarker(entry)
            if (!marker) return null
            return <MarkerBadge key={marker.id ?? i} marker={marker} />
          })}
        </div>
      </button>
    </div>
  )
}
