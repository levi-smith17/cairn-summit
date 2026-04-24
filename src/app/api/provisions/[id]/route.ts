import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provision = await prisma.provision.findFirst({
    where: { id: id, wayfarerId: session.user.id },
    include: { markers: { include: { marker: true } } },
  })

  if (!provision) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ provision })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.provision.findFirst({
    where: { id: id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, amount, billingCycle, nextRenewal, url, notes, active, markerIds } = body

  const provision = await prisma.provision.update({
    where: { id: id },
    data: {
      ...(name !== undefined && { name }),
      ...(amount !== undefined && { amount }),
      ...(billingCycle !== undefined && { billingCycle }),
      ...(nextRenewal !== undefined && { nextRenewal: new Date(nextRenewal) }),
      ...(url !== undefined && { url }),
      ...(notes !== undefined && { notes }),
      ...(active !== undefined && { active }),
      ...(markerIds !== undefined && {
        markers: {
          deleteMany: {},
          create: markerIds.map((markerId: string) => ({ markerId })),
        },
      }),
    },
    include: {
      markers: { include: { marker: true } },
    },
  })

  return NextResponse.json({ provision })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.provision.findFirst({
    where: { id: id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.provision.delete({ where: { id: id } })
  return NextResponse.json({ success: true })
}
