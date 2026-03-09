'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveBudget({
  id,
  category,
  limit,
  month,
  year,
}: {
  id?: string
  category: string
  limit: number
  month: number
  year: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (id) {
    await prisma.budget.update({
      where: { id },
      data: { category, limit },
    })
  } else {
    await prisma.budget.upsert({
      where: { wayfarerId_category_month_year: { wayfarerId, category, month, year } },
      update: { limit },
      create: { category, limit, month, year, wayfarerId },
    })
  }

  revalidatePath('/provisions')
}

export async function deleteBudget(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.budget.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!existing) throw new Error('Not found')

  await prisma.budget.delete({ where: { id } })
  revalidatePath('/provisions')
}