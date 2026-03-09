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

  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const where: any = { wayfarerId }
  if (month) where.month = parseInt(month)
  if (year) where.year = parseInt(year)

  const budgets = await prisma.budget.findMany({
    where,
    orderBy: { category: 'asc' },
  })

  return NextResponse.json({ budgets })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const wayfarerId = session.user.id

  const body = await req.json()
  const { category, limit, month, year } = body

  if (!category || !limit || !month || !year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const budget = await prisma.budget.upsert({
    where: { wayfarerId_category_month_year: { wayfarerId, category, month, year } },
    update: { limit },
    create: { category, limit, month, year, wayfarerId },
  })

  return NextResponse.json({ budget }, { status: 201 })
}