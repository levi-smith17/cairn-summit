'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { ExpenseDrawer } from '@/components/drawers/expense-drawer'
import { deleteExpense } from '@/actions/expenses'

interface Tag {
  tagId: string
  tag: { id: string; name: string; color: string; icon?: string }
}

interface Expense {
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
  month: number
  year: number
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
  categories: string[]
  tags: any[]
  refreshKey: number
  onRefresh: () => void
}

export default function ExpensesList({
  month,
  year,
  onMonthChange,
  onYearChange,
  refreshKey,
  onRefresh,
}: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/provisions/categories').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
    ]).then(([catData, tagData]) => {
      setCategories(catData.categories)
      setTags(tagData.tags)
    })
  }, [refreshKey])

  useEffect(() => {
    setPage(1)
  }, [month, year, search, categoryFilter])

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true)
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
        page: String(page),
      })
      if (search) params.set('search', search)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      try {
        const res = await fetch(`/api/expenses?${params}`)
        const data = await res.json()
        setExpenses(data.expenses)
        setTotal(data.total)
        setHasMore(data.hasMore)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchExpenses()
  }, [month, year, page, search, categoryFilter, refreshKey])

  function handleEdit(expense: Expense) {
    setEditTarget(expense)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditTarget(null)
    onRefresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    onRefresh()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const prevMonth = () => {
    if (month === 1) { onMonthChange(12); onYearChange(year - 1) }
    else onMonthChange(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) { onMonthChange(1); onYearChange(year + 1) }
    else onMonthChange(month + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium w-40 text-center">{monthName}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">{total} expenses</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="text-muted-foreground text-sm">No expenses found.</div>
      ) : (
        <div className="space-y-3">
          {expenses.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{e.name}</span>
                    <Badge variant="secondary">{e.category}</Badge>
                    {e.tags.map(({ tag }) => (
                      <MarkerBadge key={tag.id} marker={tag} />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(e.date).toLocaleDateString()}
                    {e.notes && <span className="ml-3">{e.notes}</span>}
                    {e.receiptUrl && (
                      <button
                        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => window.open(`/api/receipts/${e.receiptUrl?.split('/').pop()}`, '_blank')}
                      >
                        <Receipt className="h-3 w-3" />
                        View receipt
                      </button>
                    )}
                  </div>
                </div>

                <div className="font-semibold shrink-0">{fmt(e.amount)}</div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <ExpenseDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        expense={editTarget}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}