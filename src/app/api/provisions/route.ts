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

  const category = searchParams.get('category')
  const active = searchParams.get('active')
  const billingCycle = searchParams.get('billingCycle')
  const search = searchParams.get('search')
  const tagId = searchParams.get('tagId')

  const where: any = { wayfarerId }
  if (category) where.category = category
  if (active !== null && active !== undefined) where.active = active === 'true'
  if (billingCycle) where.billingCycle = billingCycle
  if (tagId) where.tags = { some: { tagId } }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]
  }

  const provisions = await prisma.provision.findMany({
    where,
    orderBy: { nextRenewal: 'asc' },
    include: {
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json({ provisions })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const wayfarerId = session.user.id

  const body = await req.json()
  const { name, amount, billingCycle, nextRenewal, category, url, notes, active, tagIds } = body

  if (!name || !amount || !billingCycle || !nextRenewal || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const provision = await prisma.provision.create({
    data: {
      name,
      amount,
      billingCycle,
      nextRenewal: new Date(nextRenewal),
      category,
      url: url ?? null,
      notes: notes ?? null,
      active: active ?? true,
      wayfarerId,
      tags: {
        create: (tagIds ?? []).map((tagId: string) => ({ tagId })),
      },
    },
    include: {
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json({ provision }, { status: 201 })
}