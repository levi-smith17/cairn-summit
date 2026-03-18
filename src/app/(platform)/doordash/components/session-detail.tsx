'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Check, Gauge, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { saveOrder } from '@/actions/doordash'
import { orderTotalMiles } from '@/lib/doordash'

function toNum(v: any) { return parseFloat(String(v)) }
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

interface SessionDetailProps {
  session: any | null
  onBack: () => void
  onEdit: (session: any) => void
  onDelete: (id: string, label: string) => void
  onDeleteOrder: (id: string) => void
}

export function SessionDetail({ session, onBack, onEdit, onDelete, onDeleteOrder }: SessionDetailProps) {
  const [adding, setAdding] = useState(false)
  const [newDelivery, setNewDelivery] = useState('')
  const [newPickup, setNewPickup] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDelivery, setEditDelivery] = useState('')
  const [editPickup, setEditPickup] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newDelivery || !session) return
    setSaving(true)
    await saveOrder({
      sessionId: session.id,
      deliveryMiles: parseFloat(newDelivery),
      pickupMiles: newPickup ? parseFloat(newPickup) : null,
    })
    setNewDelivery('')
    setNewPickup('')
    setAdding(false)
    setSaving(false)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId || !editDelivery || !session) return
    setSaving(true)
    await saveOrder({
      id: editingId,
      sessionId: session.id,
      deliveryMiles: parseFloat(editDelivery),
      pickupMiles: editPickup ? parseFloat(editPickup) : null,
    })
    setEditingId(null)
    setEditDelivery('')
    setEditPickup('')
    setSaving(false)
  }

  function startEdit(order: any) {
    setEditingId(order.id)
    setEditDelivery(String(toNum(order.deliveryMiles)))
    setEditPickup(order.pickupMiles != null ? String(toNum(order.pickupMiles)) : '')
    setAdding(false)
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Select a session to view its orders.
      </div>
    )
  }

  const mpg = toNum(session.mpg)
  const gasPrice = toNum(session.gasPrice)

  // Per-order totals
  const orderMilesTotal = session.orders.reduce((s: number, o: any) => s + orderTotalMiles(toNum(o.deliveryMiles), o.pickupMiles != null ? toNum(o.pickupMiles) : null), 0)
  const orderCostTotal = session.orders.reduce((s: number, o: any) => s + (orderTotalMiles(toNum(o.deliveryMiles), o.pickupMiles != null ? toNum(o.pickupMiles) : null) / mpg) * gasPrice, 0)

  // Odometer-based totals (more accurate when available)
  const hasOdometer = session.startOdometer != null && session.endOdometer != null
  const odoMiles = hasOdometer ? toNum(session.endOdometer) - toNum(session.startOdometer) : null
  const odoCost = odoMiles != null ? (odoMiles / mpg) * gasPrice : null

  const inlineFormRow = (
    delivery: string, setDelivery: (v: string) => void,
    pickup: string, setPickup: (v: string) => void,
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    onCancel: () => void,
    autoFocus = true,
  ) => (
    <form onSubmit={onSubmit} className="px-3 py-2 border-b border-border bg-muted/30 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col gap-1 flex-1">
          <Input
            autoFocus={autoFocus}
            type="number"
            step="0.1"
            placeholder="Delivery mi"
            value={delivery}
            onChange={e => setDelivery(e.target.value)}
            className="h-7 text-sm"
            disabled={saving}
          />
          <Input
            type="number"
            step="0.1"
            placeholder="Pickup mi (optional)"
            value={pickup}
            onChange={e => setPickup(e.target.value)}
            className="h-7 text-sm"
            disabled={saving}
          />
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <Button type="submit" size="icon" variant="ghost" className="h-7 w-7" disabled={saving || !delivery}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel} disabled={saving}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </form>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-sm font-medium">{fmtDate(session.date)}</span>
            <p className="text-xs text-muted-foreground">
              {fmt(gasPrice)}/gal · {toNum(session.mpg).toFixed(1)} mpg
              {hasOdometer && ` · ${odoMiles!.toFixed(1)} mi (odometer)`}
              {session.notes && ` · ${session.notes}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAdding(true); setEditingId(null) }}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add order</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(session)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit session</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(session.id, fmtDate(session.date))}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove session</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto">
        {adding && inlineFormRow(
          newDelivery, setNewDelivery, newPickup, setNewPickup,
          handleAdd, () => { setAdding(false); setNewDelivery(''); setNewPickup('') },
        )}

        {session.orders.length === 0 && !adding ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No orders yet. Add the first one.
          </div>
        ) : (
          session.orders.map((order: any, i: number) => {
            const delivery = toNum(order.deliveryMiles)
            const pickup = order.pickupMiles != null ? toNum(order.pickupMiles) : null
            const total = delivery + (pickup ?? 0)
            const cost = (total / mpg) * gasPrice

            return editingId === order.id
              ? <div key={order.id}>{inlineFormRow(
                  editDelivery, setEditDelivery, editPickup, setEditPickup,
                  handleEdit, () => { setEditingId(null); setEditDelivery(''); setEditPickup('') },
                )}</div>
              : (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 group hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Order {i + 1}</span>
                    <span className="text-xs text-muted-foreground">
                      {delivery.toFixed(1)} mi delivery
                      {pickup != null && ` + ${pickup.toFixed(1)} mi pickup`}
                      {' · '}{fmt(cost)} est. fuel
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(order)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit order</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteOrder(order.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove order</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
          })
        )}
      </div>

      {/* Totals footer */}
      {session.orders.length > 0 && (
        <div className="shrink-0 border-t border-border bg-muted/30">
          {hasOdometer && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                {odoMiles!.toFixed(1)} mi odometer
              </span>
              <span className="font-semibold">{fmt(odoCost!)} est. fuel</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-muted-foreground">
              {session.orders.length} order{session.orders.length !== 1 ? 's' : ''} · {orderMilesTotal.toFixed(1)} mi (orders)
            </span>
            <span className={hasOdometer ? 'text-muted-foreground' : 'font-semibold'}>
              {fmt(orderCostTotal)} est. fuel
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
