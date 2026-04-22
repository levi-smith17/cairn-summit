'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type StonePlacement = 'UNPLACED' | 'PLACED' | 'SET' | 'SEATED'

// ── Guides ────────────────────────────────────────────────────────────────────

export async function saveGuide(data: {
  id?: string
  name: string
  description?: string | null
  trailId?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  let guide
  if (data.id) {
    const existing = await prisma.guide.findFirst({ where: { id: data.id, wayfarerId } })
    if (!existing) throw new Error('Not found')
    guide = await prisma.guide.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        trailId: data.trailId ?? null,
      },
    })
  } else {
    guide = await prisma.guide.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        trailId: data.trailId ?? null,
        wayfarerId,
      },
    })
  }

  revalidatePath('/guides')
  return guide
}

export async function deleteGuide(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await prisma.guide.deleteMany({ where: { id, wayfarerId: session.user.id } })
  revalidatePath('/guides')
}

// ── Stones ────────────────────────────────────────────────────────────────────

export async function saveStone(data: {
  id?: string
  face: string
  core: string
  guideId: string
  markerIds?: string[]
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  // Verify guide belongs to this wayfarer
  const guide = await prisma.guide.findFirst({ where: { id: data.guideId, wayfarerId } })
  if (!guide) throw new Error('Not found')

  let stone
  if (data.id) {
    stone = await prisma.stone.update({
      where: { id: data.id },
      data: {
        face: data.face,
        core: data.core,
        markers: {
          deleteMany: {},
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
        },
      },
    })
  } else {
    stone = await prisma.stone.create({
      data: {
        face: data.face,
        core: data.core,
        guideId: data.guideId,
        markers: {
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
        },
      },
    })
  }

  revalidatePath('/guides')
  return stone
}

export async function deleteStone(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  // Verify ownership via guide
  const stone = await prisma.stone.findFirst({
    where: { id },
    include: { guide: true },
  })
  if (!stone || stone.guide.wayfarerId !== wayfarerId) throw new Error('Not found')

  await prisma.stone.delete({ where: { id } })
  revalidatePath('/guides')
}

// ── Placement ─────────────────────────────────────────────────────────────────

export async function updateStonePlacement(stoneId: string, placement: StonePlacement) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  const stone = await prisma.stone.findFirst({
    where: { id: stoneId },
    include: { guide: true },
  })
  if (!stone || stone.guide.wayfarerId !== wayfarerId) throw new Error('Not found')

  await prisma.stone.update({ where: { id: stoneId }, data: { placement } })
  revalidatePath('/guides')
}

export async function resetGuidePlacements(guideId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  const guide = await prisma.guide.findFirst({ where: { id: guideId, wayfarerId } })
  if (!guide) throw new Error('Not found')

  await prisma.stone.updateMany({ where: { guideId }, data: { placement: 'UNPLACED' } })
  revalidatePath('/guides')
}
