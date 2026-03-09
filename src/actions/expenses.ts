'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { r2, R2_BUCKET } from '@/lib/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function saveExpense({
  id,
  name,
  amount,
  category,
  date,
  notes,
  tagIds,
  receiptUrl,
}: {
  id?: string
  name: string
  amount: number
  category: string
  date: string
  notes?: string | null
  tagIds: string[]
  receiptUrl?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (id) {
    await prisma.expense.update({
      where: { id },
      data: {
        name,
        amount,
        category,
        date: new Date(date),
        notes: notes ?? null,
        ...(receiptUrl !== undefined && { receiptUrl }),
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    })
  } else {
    await prisma.expense.create({
      data: {
        name,
        amount,
        category,
        date: new Date(date),
        notes: notes ?? null,
        receiptUrl: receiptUrl ?? null,
        wayfarerId,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    })
  }

  revalidatePath('/provisions')
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.expense.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!existing) throw new Error('Not found')

  // Delete receipt from R2 if it exists
  if (existing.receiptUrl) {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: existing.receiptUrl,
      })
    )
  }

  await prisma.expense.delete({ where: { id } })
  revalidatePath('/provisions')
}