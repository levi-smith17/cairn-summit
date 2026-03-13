'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, Wallet, RefreshCw, Copy } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { ExpenseRow, type Expense } from './expense-row'
import { InlineExpenseForm } from './inline-expense-form'
import { SupplylineRow, type Provision } from './supplyline-row'
import { InlineSupplylineForm } from './inline-supplyline-form'
import { CacheRow, type BudgetUtilization } from './cache-row'
import { InlineCacheForm } from './inline-cache-form'
import { carryOverBudgets } from '@/actions/budgets'

interface Summary {
  monthlyProvisionCost: number
  totalExpenses: number
  totalMonthSpend: number
  activeProvisions: number
}

interface UpcomingRenewal {
  id: string
  name: string
  amount: number
  nextRenewal: string
  billingCycle: string
  category: string
}

interface Props {
  categories: string[]
  markers: any[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function ProvisionsClient({ categories: initialCategories, markers }: Props) {
  const { terms } = useTerminology()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)

  // Summary data
  const [summary, setSummary] = useState<Summary | null>(null)
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([])
  const [budgetUtilization, setBudgetUtilization] = useState<BudgetUtilization[]>([])
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Expense panel state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<string[]>(initialCategories)
  const expenseTags = markers
  const [expenseLoading, setExpenseLoading] = useState(true)
  const [expenseSearch, setExpenseSearch] = useState('')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all')
  const [addingExpense, setAddingExpense] = useState(false)

  // Supplyline panel state
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [provisionCategories, setProvisionCategories] = useState<string[]>(initialCategories)
  const [provisionLoading, setProvisionLoading] = useState(true)
  const [provisionSearch, setProvisionSearch] = useState('')
  const [provisionCategoryFilter, setProvisionCategoryFilter] = useState('all')
  const [provisionActiveFilter, setProvisionActiveFilter] = useState('all')
  const [addingProvision, setAddingProvision] = useState(false)

  // Cache (budget) panel state
  const [addingBudget, setAddingBudget] = useState(false)

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true)
      try {
        const res = await fetch(`/api/provisions/summary?month=${month}&year=${year}`)
        const data = await res.json()
        setSummary(data.summary)
        setUpcomingRenewals(data.upcomingRenewals)
        setBudgetUtilization(data.budgetUtilization)
      } catch (err) {
        console.error('Failed to load summary', err)
      } finally {
        setSummaryLoading(false)
      }
    }
    fetchSummary()
  }, [month, year, refreshKey])

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      setExpenseLoading(true)
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (expenseSearch) params.set('search', expenseSearch)
      if (expenseCategoryFilter !== 'all') params.set('category', expenseCategoryFilter)
      try {
        const [expRes, catRes] = await Promise.all([
          fetch(`/api/expenses?${params}`),
          fetch('/api/provisions/categories'),
        ])
        const expData = await expRes.json()
        const catData = await catRes.json()
        setExpenses(expData.expenses ?? [])
        setExpenseCategories(catData.categories ?? [])
      } catch (err) {
        console.error('Failed to load expenses', err)
      } finally {
        setExpenseLoading(false)
      }
    }
    fetchExpenses()
  }, [month, year, expenseSearch, expenseCategoryFilter, refreshKey])

  // Fetch provisions/supplylines
  useEffect(() => {
    const fetchProvisions = async () => {
      setProvisionLoading(true)
      const params = new URLSearchParams()
      if (provisionSearch) params.set('search', provisionSearch)
      if (provisionCategoryFilter !== 'all') params.set('category', provisionCategoryFilter)
      if (provisionActiveFilter !== 'all') params.set('active', provisionActiveFilter)
      try {
        const [provRes, catRes] = await Promise.all([
          fetch(`/api/provisions?${params}`),
          fetch('/api/provisions/categories'),
        ])
        const provData = await provRes.json()
        const catData = await catRes.json()
        setProvisions(provData.provisions ?? [])
        setProvisionCategories(catData.categories ?? [])
      } catch (err) {
        console.error('Failed to load provisions', err)
      } finally {
        setProvisionLoading(false)
      }
    }
    fetchProvisions()
  }, [provisionSearch, provisionCategoryFilter, provisionActiveFilter, refreshKey])

  // Month navigation
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  // Group expenses by category
  const groupedExpenses = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})
  const sortedExpenseCategories = Object.keys(groupedExpenses).sort()
  const categoryTotals = sortedExpenseCategories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = groupedExpenses[cat].reduce((sum, e) => sum + e.amount, 0)
    return acc
  }, {})

  return (
    <>
      <PlatformHeader title={terms.provisions} />
      <div className="flex flex-col flex-1 gap-4 p-4 min-h-0 overflow-y-auto lg:overflow-hidden">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> {terms.supplylines}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryLoading ? '—' : fmt(summary?.monthlyProvisionCost ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary?.activeProvisions ?? 0} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> {monthName} {terms.burn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryLoading ? '—' : fmt(summary?.totalExpenses ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">recorded this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Total Month Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryLoading ? '—' : fmt(summary?.totalMonthSpend ?? 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{terms.supplylines.toLowerCase()} + {terms.burn.toLowerCase()}</p>
            </CardContent>
          </Card>

          <Card className={upcomingRenewals.length > 0 ? 'border-amber-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Upcoming Renewals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingRenewals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">within 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Renewal Alerts */}
        {upcomingRenewals.length > 0 && (
          <div className="shrink-0 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Upcoming Renewals</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingRenewals.map((r) => {
                const daysUntil = Math.ceil((new Date(r.nextRenewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <Badge key={r.id} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                    {r.name} — {fmt(r.amount)} in {daysUntil}d
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row lg:flex-1 gap-4 lg:overflow-hidden lg:min-h-0">

          {/* Left: Burn / Expenses */}
          <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card lg:overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-36 text-center">{monthName}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setAddingExpense((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Filter bar */}
            <div className="flex gap-2 px-4 py-2 border-b shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={`${terms.explore} ${terms.burn.toLowerCase()}…`}
                  className="pl-8 h-8 text-xs"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                />
              </div>
              <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                <SelectTrigger size="sm" className="w-36 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {expenseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Inline add form */}
            {addingExpense && (
              <div className="shrink-0">
                <InlineExpenseForm
                  categories={expenseCategories}
                  tags={expenseTags}
                  onSaved={() => { setAddingExpense(false); refresh() }}
                  onCancel={() => setAddingExpense(false)}
                />
              </div>
            )}

            {/* Expense list grouped by category */}
            <div className="flex-1 lg:overflow-y-auto">
              {expenseLoading ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">Loading…</div>
              ) : expenses.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No {terms.burn.toLowerCase()} found.</div>
              ) : (
                <div className="flex flex-col divide-y">
                  {sortedExpenseCategories.map((category) => (
                    <div key={category}>
                      <div className="lg:sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {category}
                          <span className="ml-2 font-normal normal-case">
                            ({groupedExpenses[category].length})
                          </span>
                        </span>
                        <span className="text-xs font-medium tabular-nums">
                          {fmt(categoryTotals[category])}
                        </span>
                      </div>
                      <div className="divide-y">
                        {groupedExpenses[category].map((expense) => (
                          <ExpenseRow
                            key={expense.id}
                            expense={expense}
                            categories={expenseCategories}
                            tags={expenseTags}
                            onSaved={refresh}
                            onDeleted={refresh}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Supplylines + Cache */}
          <div className="w-full lg:w-112 shrink-0 flex flex-col gap-4">

            {/* Supplylines panel */}
            <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
                <span className="text-sm font-semibold">{terms.supplylines}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setAddingProvision((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex gap-2 px-3 py-2 border-b shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`${terms.explore} ${terms.supplylines.toLowerCase()}…`}
                    className="pl-8 h-8 text-xs"
                    value={provisionSearch}
                    onChange={(e) => setProvisionSearch(e.target.value)}
                  />
                </div>
                <Select value={provisionCategoryFilter} onValueChange={setProvisionCategoryFilter}>
                  <SelectTrigger size="sm" className="w-28 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {provisionCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={provisionActiveFilter} onValueChange={setProvisionActiveFilter}>
                  <SelectTrigger size="sm" className="w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {addingProvision && (
                <InlineSupplylineForm
                  categories={provisionCategories}
                  tags={expenseTags}
                  onSaved={() => { setAddingProvision(false); refresh() }}
                  onCancel={() => setAddingProvision(false)}
                />
              )}

              <div className="divide-y overflow-y-auto max-h-144">
                {provisionLoading ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">Loading…</div>
                ) : provisions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No {terms.supplylines.toLowerCase()} found.</div>
                ) : (
                  provisions.map((p) => (
                    <SupplylineRow
                      key={p.id}
                      provision={p}
                      categories={provisionCategories}
                      tags={expenseTags}
                      onSaved={refresh}
                      onDeleted={refresh}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Cache / Budgets panel */}
            <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
                <span className="text-sm font-semibold">{terms.cache}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    title="Copy from last month"
                    onClick={async () => { await carryOverBudgets({ month, year }); refresh() }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setAddingBudget((v) => !v)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {addingBudget && (
                <InlineCacheForm
                  categories={expenseCategories}
                  month={month}
                  year={year}
                  onSaved={() => { setAddingBudget(false); refresh() }}
                  onCancel={() => setAddingBudget(false)}
                />
              )}

              <div className="divide-y overflow-y-auto max-h-96">
                {budgetUtilization.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No {terms.cache.toLowerCase()} set for this month.</div>
                ) : (
                  budgetUtilization.map((b) => (
                    <CacheRow
                      key={b.id}
                      budget={b}
                      categories={expenseCategories}
                      month={month}
                      year={year}
                      onSaved={refresh}
                      onDeleted={refresh}
                    />
                  ))
                )}
              </div>

              {budgetUtilization.length > 0 && (() => {
                const totalSpent = budgetUtilization.reduce((s, b) => s + b.spent, 0)
                const totalLimit = budgetUtilization.reduce((s, b) => s + b.limit, 0)
                const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
                return (
                  <div className="px-3 py-2 border-t bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Total</span>
                      <span className="text-xs tabular-nums font-medium">
                        {fmt(totalSpent)} <span className="text-muted-foreground font-normal">/ {fmt(totalLimit)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          totalPct >= 100 ? 'bg-destructive' :
                          totalPct >= 80 ? 'bg-amber-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${Math.min(totalPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{Math.round(totalPct)}% used</span>
                      <span>{fmt(Math.max(totalLimit - totalSpent, 0))} left</span>
                    </div>
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
