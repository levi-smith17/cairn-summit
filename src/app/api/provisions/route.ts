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

  const active = searchParams.get('active')
  const billingCycle = searchParams.get('billingCycle')
  const search = searchParams.get('search')
  const markerId = searchParams.get('markerId')

  const where: any = { wayfarerId }
  if (active !== null && active !== undefined) where.active = active === 'true'
  if (billingCycle) where.billingCycle = billingCycle
  if (markerId) where.markers = { some: { markerId } }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]
  }

  const provisions = await prisma.provision.findMany({
    where,
    orderBy: { nextRenewal: 'asc' },
    include: {
      markers: { include: { marker: true } },
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
  const { name, amount, billingCycle, nextRenewal, url, notes, active, markerIds } = body

  if (!name || !amount || !billingCycle || !nextRenewal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const provision = await prisma.provision.create({
    data: {
      name,
      amount,
      billingCycle,
      nextRenewal: new Date(nextRenewal),
      url: url ?? null,
      notes: notes ?? null,
      active: active ?? true,
      wayfarerId,
      markers: {
        create: (markerIds ?? []).map((markerId: string) => ({ markerId })),
      },
    },
    include: {
      markers: { include: { marker: true } },
    },
  })

  return NextResponse.json({ provision }, { status: 201 })
}
