'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function toNum(v: any) { return parseFloat(String(v)) }

function orderMiles(o: any) {
  return toNum(o.deliveryMiles) + (o.pickupMiles != null ? toNum(o.pickupMiles) : 0)
}

function fuelCost(session: any) {
  const mpg = toNum(session.mpg)
  const price = toNum(session.gasPrice)
  return session.orders.reduce((sum: number, o: any) => sum + (orderMiles(o) / mpg) * price, 0)
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

interface SessionListProps {
  sessions: any[]
  selectedSessionId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (session: any) => void
  onDelete: (id: string, label: string) => void
}

export function SessionList({ sessions, selectedSessionId, onSelect, onNew, onEdit, onDelete }: SessionListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New session</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No sessions yet.
          </div>
        )}
        {sessions.map(session => {
          const cost = fuelCost(session)
          const totalMiles = session.orders.reduce((s: number, o: any) => s + orderMiles(o), 0)
          return (
            <div
              key={session.id}
              className={`
                flex items-center justify-between px-4 py-3 border-b border-border/50
                cursor-pointer transition-colors group
                ${selectedSessionId === session.id ? 'bg-primary/20' : 'hover:bg-muted/50'}
              `}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium">{fmtDate(session.date)}</span>
                <span className="text-xs text-muted-foreground">
                  {session.orders.length} order{session.orders.length !== 1 ? 's' : ''}
                  {totalMiles > 0 && ` · ${totalMiles.toFixed(1)} mi`}
                  {cost > 0 && ` · ${fmt(cost)}`}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {fmt(toNum(session.gasPrice))}/gal · {toNum(session.mpg).toFixed(1)} mpg
                </span>
              </div>
              <div
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(session)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit session</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(session.id, fmtDate(session.date))}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove session</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
