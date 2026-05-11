import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Returns the amount a provision contributes to a given month.
// WEEKLY/BIWEEKLY/MONTHLY: always prorated monthly equivalent.
// QUARTERLY/ANNUALLY: full amount only if the subscription actually bills
// during this month (next renewal is this month, or previous cycle was this month).
function provisionAmountForMonth(
  billingCycle: string,
  amount: number,
  nextRenewal: Date,
  monthStart: Date,
  monthEnd: Date
): number {
  if (billingCycle === 'QUARTERLY' || billingCycle === 'ANNUALLY') {
    // Check upcoming renewal
    if (nextRenewal >= monthStart && nextRenewal <= monthEnd) return amount
    // Check previous billing date (already renewed this month)
    const prev = new Date(nextRenewal)
    if (billingCycle === 'QUARTERLY') {
      prev.setMonth(prev.getMonth() - 3)
    } else {
      prev.setFullYear(prev.getFullYear() - 1)
    }
    if (prev >= monthStart && prev <= monthEnd) return amount
    return 0
  }

  const cycleToMonths: Record<string, number> = {
    WEEKLY: 1 / 4.33,
    BIWEEKLY: 1 / 2.17,
    MONTHLY: 1,
  }
  return amount * (cycleToMonths[billingCycle] ?? 1)
}

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
    prisma.provision.findMany({
      where: { wayfarerId, active: true },
      orderBy: { nextRenewal: 'asc' },
      include: { markers: { include: { marker: true } } },
    }),
    prisma.expense.findMany({
      where: { wayfarerId, date: { gte: monthStart, lte: monthEnd } },
      include: { markers: { include: { marker: true } } },
    }),
    prisma.budget.findMany({
      where: { wayfarerId, month, year },
      include: { marker: true },
    }),
    prisma.provision.findMany({
      where: { wayfarerId, active: true, nextRenewal: { gte: now, lte: in7Days } },
      orderBy: { nextRenewal: 'asc' },
      include: { markers: { include: { marker: true } } },
    }),
  ])

  // Group expenses by markerId (first marker, if any)
  const expensesByMarker = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    const markerId = e.markers[0]?.markerId ?? '__none__'
    acc[markerId] = (acc[markerId] ?? 0) + e.amount
    return acc
  }, {})

  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Monthly provision cost: QUARTERLY/ANNUALLY only count if billing this month
  const monthlyProvisionCost = provisions.reduce((sum, p) => {
    return sum + provisionAmountForMonth(p.billingCycle, p.amount, new Date(p.nextRenewal), monthStart, monthEnd)
  }, 0)

  // Provision cost per markerId (same billing-aware logic) for budget utilization
  const provisionCostByMarker = provisions.reduce<Record<string, number>>((acc, p) => {
    const contrib = provisionAmountForMonth(p.billingCycle, p.amount, new Date(p.nextRenewal), monthStart, monthEnd)
    if (contrib > 0) {
      const markerId = p.markers[0]?.markerId ?? '__none__'
      acc[markerId] = (acc[markerId] ?? 0) + contrib
    }
    return acc
  }, {})

  const budgetUtilization = budgets.map((b) => {
    const expenseSpend = expensesByMarker[b.markerId] ?? 0
    const provisionSpend = provisionCostByMarker[b.markerId] ?? 0
    const spent = expenseSpend + provisionSpend
    return {
      ...b,
      spent,
      utilization: (spent / b.limit) * 100,
    }
  })

  return NextResponse.json({
    summary: {
      monthlyProvisionCost,
      totalExpenses,
      totalMonthSpend: monthlyProvisionCost + totalExpenses,
      activeProvisions: provisions.length,
      expensesByMarker,
    },
    upcomingRenewals,
    budgetUtilization,
    month,
    year,
  })
}
