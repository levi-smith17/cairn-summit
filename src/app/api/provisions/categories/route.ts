import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const wayfarerId = session.user.id

  const [provisionCategories, expenseCategories] = await Promise.all([
    prisma.provision.findMany({
      where: { wayfarerId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
    prisma.expense.findMany({
      where: { wayfarerId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ])

  // Merge and deduplicate across both models
  const all = [...new Set([
    ...provisionCategories.map((p) => p.category),
    ...expenseCategories.map((e) => e.category),
  ])].sort()

  return NextResponse.json({ categories: all })
}