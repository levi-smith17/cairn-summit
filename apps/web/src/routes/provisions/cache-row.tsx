import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
import { Pencil, Trash2 } from 'lucide-react'
import { deleteBudget } from '@/lib/api/provisions'
import { InlineCacheForm } from './inline-cache-form'
import { useTerminology } from '@/contexts/terminology-context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface BudgetUtilization {
  id: string
  markerId: string
  marker: { id: string; name: string; color: string }
  limit: number
  spent: number
  utilization: number
}

interface Props {
  budget: BudgetUtilization
  markers: any[]
  month: number
  year: number
  onSaved: () => void
  onDeleted: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const utilizationColor = (pct: number) => {
  if (pct >= 100) return 'bg-destructive'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-primary'
}

export function CacheRow({ budget, markers, month, year, onSaved, onDeleted }: Props) {
  const { terms } = useTerminology()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (editing) {
    return (
      <InlineCacheForm
        budget={budget}
        markers={markers}
        month={month}
        year={year}
        onSaved={() => { setEditing(false); onSaved() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div className="px-3 py-2.5 hover:bg-muted/30 group">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">{budget.marker?.name.split('/').pop() ?? 'Uncategorized'}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit {terms.cache}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove {terms.cache}</TooltipContent>
            </Tooltip>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums group-hover:hidden">
            {fmt(budget.spent)} / {fmt(budget.limit)}
          </span>
        </div>
        <Progress
          value={Math.min(budget.utilization, 100)}
          className="h-1.5"
          indicatorClassName={utilizationColor(budget.utilization)}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{Math.round(budget.utilization)}% used</span>
          <span>{fmt(Math.max(budget.limit - budget.spent, 0))} left</span>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.cache.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the &ldquo;{budget.marker?.name.split('/').pop() ?? 'Uncategorized'}&rdquo; {terms.cache.toLowerCase()} limit for this month. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { await deleteBudget(budget.id); onDeleted() }}
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
