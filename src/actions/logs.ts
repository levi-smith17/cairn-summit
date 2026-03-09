'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveLog(data: {
  id?: string
  content: string
  folderId?: string | null
  waypointId?: string | null
  tagIds?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    await prisma.log.update({
      where: { id: data.id },
      data: {
        content: data.content,
        folderId: data.folderId,
        waypointId: data.waypointId,
        tags: {
          deleteMany: {},
          create: data.tagIds?.map(tagId => ({ tagId })) ?? [],
        },
      },
    })
  } else {
    await prisma.log.create({
      data: {
        content: data.content,
        folderId: data.folderId,
        waypointId: data.waypointId,
        wayfarerId,
        tags: {
          create: data.tagIds?.map(tagId => ({ tagId })) ?? [],
        },
      },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/log')
}

export async function deleteLog(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.log.delete({ where: { id } })
  revalidatePath('/dashboard')
  revalidatePath('/log')
}