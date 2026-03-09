'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { BudgetDrawer } from '@/components/drawers/budget-drawer'
import { deleteBudget } from '@/actions/budgets'

interface BudgetUtilization {
  id: string
  category: string
  limit: number
  spent: number
  utilization: number
}

interface Props {
  month: number
  year: number
  budgetUtilization: BudgetUtilization[]
  onRefresh: () => void
}

export default function BudgetLimits({ month, year, budgetUtilization, onRefresh }: Props) {
  const [categories, setCategories] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BudgetUtilization | null>(null)

  useEffect(() => {
    fetch('/api/provisions/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories))
  }, [budgetUtilization])

  function handleEdit(budget: BudgetUtilization) {
    setEditTarget(budget)
    setDrawerOpen(true)
  }

  function handleAdd() {
    setEditTarget(null)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditTarget(null)
    onRefresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this budget?')) return
    await deleteBudget(id)
    onRefresh()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const utilizationColor = (pct: number) => {
    if (pct >= 100) return 'bg-destructive'
    if (pct >= 80) return 'bg-amber-500'
    return 'bg-primary'
  }

  return (
    <div className="space-y-4">
      {budgetUtilization.length === 0 && (
        <div className="text-muted-foreground text-sm">No budgets set for this month.</div>
      )}

      {budgetUtilization.map((b) => (
        <Card key={b.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{b.category}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {fmt(b.spent)} / {fmt(b.limit)}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(b)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min(b.utilization, 100)}
              className="h-2"
              indicatorClassName={utilizationColor(b.utilization)}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{Math.round(b.utilization)}% used</span>
              <span>{fmt(Math.max(b.limit - b.spent, 0))} remaining</span>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-1" /> Add Budget
      </Button>

      <BudgetDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        budget={editTarget}
        categories={categories}
        month={month}
        year={year}
      />
    </div>
  )
}