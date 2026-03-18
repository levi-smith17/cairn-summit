'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Fuel, MapPin, TrendingDown } from 'lucide-react'
import { SessionList } from './session-list'
import { SessionDetail } from './session-detail'
import { SessionForm } from './session-form'
import { deleteSession, deleteOrder } from '@/actions/doordash'
import { orderTotalMiles, sessionFuelCost } from '@/lib/doordash'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function toNum(v: any) { return parseFloat(String(v)) }
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

interface DoordashClientProps {
  sessions: any[]
}

export function DoordashClient({ sessions }: DoordashClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view')
  const [editingSession, setEditingSession] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'session' | 'order'; id: string; label?: string } | null>(null)

  const selectedSessionId = searchParams.get('session')
  const selectedSession = sessions.find(s => s.id === selectedSessionId) ?? null

  function selectSession(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('session', id)
    router.push(`?${params.toString()}`, { scroll: false })
    setMode('view')
  }

  function clearSession() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('session')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleNew() {
    setEditingSession(null)
    setMode('add')
  }

  function handleEdit(session: any) {
    setEditingSession(session)
    setMode('edit')
  }

  function handleFormDone() {
    setMode('view')
    setEditingSession(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'session') {
      await deleteSession(deleteTarget.id)
      if (selectedSessionId === deleteTarget.id) clearSession()
    } else {
      await deleteOrder(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  // Snapshot calculations
  const allOrders = sessions.flatMap(s => s.orders)
  const totalMiles = allOrders.reduce((sum, o) => sum + orderTotalMiles(toNum(o.deliveryMiles), o.pickupMiles != null ? toNum(o.pickupMiles) : null), 0)
  const totalFuelCost = sessions.reduce((sum, s) => sum + sessionFuelCost(
    s.orders.map((o: any) => ({ deliveryMiles: toNum(o.deliveryMiles), pickupMiles: o.pickupMiles != null ? toNum(o.pickupMiles) : null })),
    toNum(s.mpg),
    toNum(s.gasPrice),
  ), 0)
  const avgCostPerOrder = allOrders.length > 0 ? totalFuelCost / allOrders.length : 0

  const showForm = mode === 'add' || mode === 'edit'
  const showRight = !!selectedSession || showForm

  return (
    <>
      <PlatformHeader title="Doordash" />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-y-auto md:overflow-hidden min-h-0">
        {/* Snapshot cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {allOrders.length} order{allOrders.length !== 1 ? 's' : ''} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Miles</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMiles.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">across all sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Fuel Cost</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalFuelCost)}</div>
              <p className="text-xs text-muted-foreground mt-1">estimated total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg / Order</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(avgCostPerOrder)}</div>
              <p className="text-xs text-muted-foreground mt-1">avg fuel cost per order</p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout */}
        <div className="flex md:flex-1 gap-4 md:overflow-hidden md:min-h-0 min-h-[60vh]">
          <div className={`${showRight ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <SessionList
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onSelect={selectSession}
              onNew={handleNew}
              onEdit={handleEdit}
              onDelete={(id, label) => setDeleteTarget({ type: 'session', id, label })}
            />
          </div>

          <div className={`${showRight ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
            {showForm ? (
              <SessionForm
                key={editingSession?.id ?? 'new'}
                session={editingSession}
                onDone={handleFormDone}
              />
            ) : (
              <SessionDetail
                session={selectedSession}
                onBack={clearSession}
                onEdit={handleEdit}
                onDelete={(id, label) => setDeleteTarget({ type: 'session', id, label })}
                onDeleteOrder={id => setDeleteTarget({ type: 'order', id })}
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'session' ? 'Remove Session' : 'Remove Order'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'session'
                ? `Are you sure you want to remove the session for "${deleteTarget?.label}"? All orders in this session will also be removed.`
                : 'Are you sure you want to remove this order?'
              } This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
