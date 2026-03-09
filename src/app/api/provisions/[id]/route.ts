import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provision = await prisma.provision.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
    include: { tags: { include: { tag: true } } },
  })

  if (!provision) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ provision })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.provision.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, amount, billingCycle, nextRenewal, category, url, notes, active, tagIds } = body

  const provision = await prisma.provision.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(amount !== undefined && { amount }),
      ...(billingCycle !== undefined && { billingCycle }),
      ...(nextRenewal !== undefined && { nextRenewal: new Date(nextRenewal) }),
      ...(category !== undefined && { category }),
      ...(url !== undefined && { url }),
      ...(notes !== undefined && { notes }),
      ...(active !== undefined && { active }),
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId: string) => ({ tagId })),
        },
      }),
    },
    include: {
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json({ provision })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.provision.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.provision.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}