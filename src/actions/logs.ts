'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveLog(data: {
  id?: string
  content: string
  trailId?: string | null
  waypointId?: string | null
  markerIds?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    const existing = await prisma.log.findFirst({ where: { id: data.id, wayfarerId } })
    if (!existing) throw new Error('Not found')

    const log = await prisma.log.update({
      where: { id: data.id },
      data: {
        content: data.content,
        trailId: data.trailId,
        waypointId: data.waypointId,
        markers: {
          deleteMany: {},
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
        },
      },
    })
    revalidatePath('/dashboard')
    revalidatePath('/log')
    return log
  } else {
    const log = await prisma.log.create({
      data: {
        content: data.content,
        trailId: data.trailId,
        waypointId: data.waypointId,
        wayfarerId,
        markers: {
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
        },
      },
    })
    revalidatePath('/dashboard')
    revalidatePath('/log')
    return log
  }
}

export async function deleteLog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.log.deleteMany({ where: { id, wayfarerId: session.user.id } })
  revalidatePath('/dashboard')
  revalidatePath('/log')
}
