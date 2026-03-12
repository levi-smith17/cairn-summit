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

  let waypoint
  if (data.id) {
    waypoint = await prisma.waypoint.update({
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
    waypoint = await prisma.waypoint.create({
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
  return waypoint
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

// --- Trails ---

export async function createTrail(name: string): Promise<{ id: string; name: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const folder = await prisma.folder.create({ data: { name, wayfarerId: session.user.id } })
  revalidatePath('/waypoints')
  return folder
}

export async function createMarker(data: {
  name: string
  color: string
}): Promise<{ id: string; name: string; color: string; icon: string | null }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const tag = await prisma.tag.create({ data: { ...data, wayfarerId: session.user.id } })
  revalidatePath('/waypoints')
  return tag
}

export async function saveTrail(data: { id?: string; name: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    const folder = await prisma.folder.update({ where: { id: data.id }, data: { name: data.name } })
    revalidatePath('/waypoints')
    revalidatePath('/trails')
    return folder
  } else {
    const folder = await prisma.folder.create({ data: { name: data.name, wayfarerId } })
    revalidatePath('/waypoints')
    revalidatePath('/trails')
    return folder
  }
}

export async function deleteTrail(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.folder.delete({ where: { id } })
  revalidatePath('/waypoints')
  revalidatePath('/trails')
}

// --- Markers ---

export async function saveMarker(data: {
  id?: string
  name: string
  color: string
  icon?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    const tag = await prisma.tag.update({
      where: { id: data.id },
      data: { name: data.name, color: data.color, icon: data.icon },
    })
    revalidatePath('/waypoints')
    revalidatePath('/markers')
    return tag
  } else {
    const tag = await prisma.tag.create({
      data: { name: data.name, color: data.color, icon: data.icon, wayfarerId },
    })
    revalidatePath('/waypoints')
    revalidatePath('/markers')
    return tag
  }
}

export async function deleteMarker(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.tag.delete({ where: { id } })
  revalidatePath('/waypoints')
  revalidatePath('/markers')
}
