'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreHorizontal, Pencil, Trash2, Receipt } from 'lucide-react'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { deleteExpense } from '@/actions/expenses'
import { InlineExpenseForm } from './inline-expense-form'

interface Tag {
  tagId: string
  tag: { id: string; name: string; color: string; icon?: string }
}

export interface Expense {
  id: string
  name: string
  amount: number
  category: string
  date: string
  notes?: string
  receiptUrl?: string | null
  tags: Tag[]
}

interface Props {
  expense: Expense
  categories: string[]
  tags: any[]
  onSaved: () => void
  onDeleted: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function ExpenseRow({ expense, categories, tags, onSaved, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (editing) {
    return (
      <InlineExpenseForm
        expense={expense}
        categories={categories}
        tags={tags}
        onSaved={() => { setEditing(false); onSaved() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 group">
        <div className="text-xs text-muted-foreground w-14 shrink-0 tabular-nums">
          {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate">{expense.name}</span>
            {expense.tags.map(({ tag }) => <MarkerBadge key={tag.id} marker={tag} />)}
          </div>
          {expense.notes && (
            <div className="text-xs text-muted-foreground truncate">{expense.notes}</div>
          )}
        </div>
        {expense.receiptUrl && (
          <button
            onClick={() => window.open(`/api/receipts/${expense.receiptUrl?.split('/').pop()}`, '_blank')}
            className="text-muted-foreground hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Receipt className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="font-medium text-sm shrink-0 tabular-nums">{fmt(expense.amount)}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{expense.name}&rdquo; and any attached receipt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { await deleteExpense(expense.id); onDeleted() }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
