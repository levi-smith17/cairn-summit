'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { BillingCycle } from '@prisma/client'

export async function saveProvision({
  id,
  name,
  amount,
  billingCycle,
  nextRenewal,
  category,
  url,
  notes,
  active,
  tagIds,
}: {
  id?: string
  name: string
  amount: number
  billingCycle: BillingCycle
  nextRenewal: string
  category: string
  url?: string | null
  notes?: string | null
  active?: boolean
  tagIds: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (id) {
    await prisma.provision.update({
      where: { id },
      data: {
        name,
        amount,
        billingCycle,
        nextRenewal: new Date(nextRenewal),
        category,
        url: url ?? null,
        notes: notes ?? null,
        ...(active !== undefined && { active }),
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    })
  } else {
    await prisma.provision.create({
      data: {
        name,
        amount,
        billingCycle,
        nextRenewal: new Date(nextRenewal),
        category,
        url: url ?? null,
        notes: notes ?? null,
        active: true,
        wayfarerId,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    })
  }

  revalidatePath('/provisions')
}

export async function toggleProvisionActive(id: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.provision.update({
    where: { id },
    data: { active },
  })

  revalidatePath('/provisions')
}

export async function deleteProvision(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.provision.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!existing) throw new Error('Not found')

  await prisma.provision.delete({ where: { id } })
  revalidatePath('/provisions')
}