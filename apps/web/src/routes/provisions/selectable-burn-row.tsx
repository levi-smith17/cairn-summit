import { Plus, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/routes/waypoints/marker-badge'
import { toDisplayMarker } from '@/lib/embedded-markers'
import { getBurnReceiptUrl } from '@/lib/api/supplylines'
import { cn } from '@/lib/utils'
import type { Burn } from './burn-row'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function SelectableBurnRow({
  burn,
  selected,
  onSelect,
}: {
  burn: Burn
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-inspectable
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors sm:px-6',
        selected ? 'bg-primary/10' : 'hover:bg-muted-hover',
      )}
    >
      <div className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
        {new Date(burn.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{burn.name}</span>
          {burn.markers.map((entry, i) => {
            const marker = toDisplayMarker(entry)
            if (!marker) return null
            return <MarkerBadge key={marker.id ?? i} marker={marker} />
          })}
        </div>
        {burn.notes ? (
          <div className="truncate text-xs text-muted-foreground">{burn.notes}</div>
        ) : null}
      </div>
      {burn.receiptUrl ? (
        <span
          role="presentation"
          onClick={async (e) => {
            e.stopPropagation()
            try {
              const url = await getBurnReceiptUrl(burn.receiptUrl!)
              window.open(url, '_blank')
            } catch {
              /* ignore */
            }
          }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Receipt className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div className="shrink-0 text-sm font-medium tabular-nums">{fmt(burn.amount)}</div>
    </button>
  )
}

export function BurnGroupHeaderActions({
  onAdd,
  label = 'Add burn',
}: {
  onAdd: () => void
  label?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-inspectable
      className="mt-0.5 h-9 w-9 shrink-0"
      title={label}
      aria-label={label}
      onClick={onAdd}
    >
      <Plus className="h-4 w-4" />
    </Button>
  )
}
