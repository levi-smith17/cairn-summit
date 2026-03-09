import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.expense.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, amount, category, date, notes, tagIds } = body

  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(amount !== undefined && { amount }),
      ...(category !== undefined && { category }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(notes !== undefined && { notes }),
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId: string) => ({ tagId })),
        },
      }),
    },
    include: { tags: { include: { tag: true } } },
  })

  return NextResponse.json({ expense })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.expense.findFirst({
    where: { id: params.id, wayfarerId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.expense.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}