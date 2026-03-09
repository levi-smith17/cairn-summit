'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, Wallet, RefreshCw } from 'lucide-react'
import ProvisionsList from './provisions-list'
import ExpensesList from './expenses-list'
import Budgets from './budgets'

interface Summary {
  monthlyProvisionCost: number
  totalExpenses: number
  totalMonthSpend: number
  activeProvisions: number
  expensesByCategory: Record<string, number>
}

interface UpcomingRenewal {
  id: string
  name: string
  amount: number
  nextRenewal: string
  billingCycle: string
  category: string
}

interface BudgetUtilization {
  id: string
  category: string
  limit: number
  spent: number
  utilization: number
}

interface Props {
  categories: string[]
  tags: any[]
}

export function ProvisionsClient({ categories, tags }: Props) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [summary, setSummary] = useState<Summary | null>(null)
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([])
  const [budgetUtilization, setBudgetUtilization] = useState<BudgetUtilization[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/provisions/summary?month=${month}&year=${year}`)
        const data = await res.json()
        setSummary(data.summary)
        setUpcomingRenewals(data.upcomingRenewals)
        setBudgetUtilization(data.budgetUtilization)
      } catch (err) {
        console.error('Failed to load provisions summary', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [month, year, refreshKey])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const monthName = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Monthly Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : fmt(summary?.monthlyProvisionCost ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.activeProvisions ?? 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> {monthName} Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : fmt(summary?.totalExpenses ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">logged this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Month Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : fmt(summary?.totalMonthSpend ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">subscriptions + expenses</p>
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
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Upcoming Renewals
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingRenewals.map((r) => {
              const daysUntil = Math.ceil(
                (new Date(r.nextRenewal).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              return (
                <Badge
                  key={r.id}
                  variant="outline"
                  className="border-amber-500/40 text-amber-700 dark:text-amber-400"
                >
                  {r.name} — {fmt(r.amount)} in {daysUntil}d
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
        {/* Tabs */}
        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-6">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <ProvisionsList
              categories={categories}
              tags={tags}
              refreshKey={refreshKey}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesList
              month={month}
              year={year}
              onMonthChange={setMonth}
              onYearChange={setYear}
              categories={categories}
              tags={tags}
              refreshKey={refreshKey}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="budgets">
            <Budgets
              month={month}
              year={year}
              budgetUtilization={budgetUtilization}
              onRefresh={refresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}