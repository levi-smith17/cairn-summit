'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// --- Waypoints ---

export async function saveWaypoint(data: {
  id?: string
  title: string
  url: string
  description?: string | null
  notes?: string | null
  favicon?: string | null
  folderId?: string | null
  tagIds?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    await prisma.waypoint.update({
      where: { id: data.id },
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        notes: data.notes,
        favicon: data.favicon,
        folderId: data.folderId,
        tags: {
          deleteMany: {},
          create: data.tagIds?.map(tagId => ({ tagId })) ?? [],
        },
      },
    })
  } else {
    await prisma.waypoint.create({
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        notes: data.notes,
        favicon: data.favicon,
        folderId: data.folderId,
        wayfarerId,
        tags: {
          create: data.tagIds?.map(tagId => ({ tagId })) ?? [],
        },
      },
    })
  }

  revalidatePath('/waypoints')
}

export async function deleteWaypoint(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.waypoint.delete({ where: { id } })
  revalidatePath('/waypoints')
}

export async function toggleWaypointRead(id: string, read: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.waypoint.update({ where: { id }, data: { read } })
  revalidatePath('/waypoints')
}

export async function toggleWaypointReadLater(id: string, readLater: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.waypoint.update({ where: { id }, data: { readLater } })
  revalidatePath('/waypoints')
}

// --- Folders ---

export async function saveFolder(data: { id?: string; name: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    await prisma.folder.update({ where: { id: data.id }, data: { name: data.name } })
  } else {
    await prisma.folder.create({ data: { name: data.name, wayfarerId } })
  }

  revalidatePath('/waypoints')
}

export async function deleteFolder(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.folder.delete({ where: { id } })
  revalidatePath('/waypoints')
}

// --- Tags ---

export async function saveTag(data: {
  id?: string
  name: string
  color: string
  icon?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    await prisma.tag.update({
      where: { id: data.id },
      data: { name: data.name, color: data.color, icon: data.icon },
    })
  } else {
    await prisma.tag.create({
      data: { name: data.name, color: data.color, icon: data.icon, wayfarerId },
    })
  }

  revalidatePath('/waypoints')
}

export async function deleteTag(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.tag.delete({ where: { id } })
  revalidatePath('/waypoints')
}