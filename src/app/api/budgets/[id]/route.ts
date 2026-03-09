import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.budget.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { limit, category } = body

  const budget = await prisma.budget.update({
    where: { id: params.id },
    data: {
      ...(limit !== undefined && { limit }),
      ...(category !== undefined && { category }),
    },
  })

  return NextResponse.json({ budget })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.budget.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.budget.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}