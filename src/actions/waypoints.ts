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
  trailId?: string | null
  markerIds?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  let waypoint
  if (data.id) {
    const existing = await prisma.waypoint.findFirst({ where: { id: data.id, wayfarerId } })
    if (!existing) throw new Error('Not found')

    waypoint = await prisma.waypoint.update({
      where: { id: data.id },
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        notes: data.notes,
        favicon: data.favicon,
        trailId: data.trailId,
        markers: {
          deleteMany: {},
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
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
        trailId: data.trailId,
        wayfarerId,
        markers: {
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
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

  await prisma.waypoint.deleteMany({ where: { id, wayfarerId: session.user.id } })
  revalidatePath('/waypoints')
}

export async function toggleWaypointRead(id: string, read: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.waypoint.updateMany({ where: { id, wayfarerId: session.user.id }, data: { read } })
  revalidatePath('/waypoints')
}

export async function toggleWaypointReadLater(id: string, readLater: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.waypoint.updateMany({ where: { id, wayfarerId: session.user.id }, data: { readLater } })
  revalidatePath('/waypoints')
}

// --- Trails ---

export async function createTrail(name: string): Promise<{ id: string; name: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const trail = await prisma.trail.create({ data: { name, wayfarerId: session.user.id } })
  revalidatePath('/waypoints')
  return trail
}

export async function createMarker(data: {
  name: string
  color: string
}): Promise<{ id: string; name: string; color: string; icon: string | null }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const marker = await prisma.marker.create({ data: { ...data, wayfarerId: session.user.id } })
  revalidatePath('/waypoints')
  return marker
}

export async function saveTrail(data: { id?: string; name: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (data.id) {
    await prisma.trail.updateMany({
      where: { id: data.id, wayfarerId },
      data: { name: data.name },
    })
    revalidatePath('/waypoints')
    revalidatePath('/trails')
    return { id: data.id, name: data.name }
  } else {
    const trail = await prisma.trail.create({ data: { name: data.name, wayfarerId } })
    revalidatePath('/waypoints')
    revalidatePath('/trails')
    return trail
  }
}

export async function deleteTrail(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.trail.deleteMany({ where: { id, wayfarerId: session.user.id } })
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
    await prisma.marker.updateMany({
      where: { id: data.id, wayfarerId },
      data: { name: data.name, color: data.color, icon: data.icon },
    })
    revalidatePath('/waypoints')
    revalidatePath('/markers')
    return { id: data.id, name: data.name, color: data.color, icon: data.icon ?? null }
  } else {
    const marker = await prisma.marker.create({
      data: { name: data.name, color: data.color, icon: data.icon, wayfarerId },
    })
    revalidatePath('/waypoints')
    revalidatePath('/markers')
    return marker
  }
}

export async function deleteMarker(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.marker.deleteMany({ where: { id, wayfarerId: session.user.id } })
  revalidatePath('/waypoints')
  revalidatePath('/markers')
}
