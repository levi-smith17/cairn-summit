import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const wayfarerId = session.user.id
  const searchParams = req.nextUrl.searchParams

  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [provisions, monthExpenses, budgets, upcomingRenewals] = await Promise.all([
    prisma.provision.findMany({ where: { wayfarerId, active: true }, orderBy: { nextRenewal: 'asc' } }),
    prisma.expense.findMany({ where: { wayfarerId, date: { gte: monthStart, lte: monthEnd } } }),
    prisma.budget.findMany({ where: { wayfarerId, month, year } }),
    prisma.provision.findMany({
      where: { wayfarerId, active: true, nextRenewal: { gte: now, lte: in7Days } },
      orderBy: { nextRenewal: 'asc' },
    }),
  ])

  const cycleToMonths: Record<string, number> = {
    WEEKLY: 1 / 4.33,
    BIWEEKLY: 1 / 2.17,
    MONTHLY: 1,
    QUARTERLY: 1 / 3,
    ANNUALLY: 1 / 12,
  }

  const monthlyProvisionCost = provisions.reduce((sum, p) => {
    return sum + p.amount * (cycleToMonths[p.billingCycle] ?? 1)
  }, 0)

  const expensesByCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const budgetUtilization = budgets.map((b) => ({
    ...b,
    spent: expensesByCategory[b.category] ?? 0,
    utilization: ((expensesByCategory[b.category] ?? 0) / b.limit) * 100,
  }))

  return NextResponse.json({
    summary: {
      monthlyProvisionCost,
      totalExpenses,
      totalMonthSpend: monthlyProvisionCost + totalExpenses,
      activeProvisions: provisions.length,
      expensesByCategory,
    },
    upcomingRenewals,
    budgetUtilization,
    month,
    year,
  })
}