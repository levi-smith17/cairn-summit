'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { r2Companions, R2_COMPANIONS_BUCKET } from '@/lib/r2-companions'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function saveOrigins({
  headline,
  summary,
  bio,
  location,
  website,
  linkedin,
  github,
}: {
  headline?: string | null
  summary?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  linkedin?: string | null
  github?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.origins.upsert({
    where: { wayfarerId: session.user.id },
    update: { headline, summary, bio, location, website, linkedin, github },
    create: { headline, summary, bio, location, website, linkedin, github, wayfarerId: session.user.id },
  })

  revalidatePath('/manifest')
}

export async function saveExpedition(data: {
  id?: string
  title: string
  company: string
  location: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.id) {
    await prisma.expedition.update({
      where: { id: data.id },
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        startDate: data.startDate,
        endDate: data.current ? null : data.endDate,
        current: data.current,
        description: data.description,
      },
    })
  } else {
    await prisma.expedition.create({
      data: {
        ...data,
        wayfarerId: session.user.id,
      },
    })
  }

  revalidatePath('/manifest')
}

export async function deleteExpedition(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.expedition.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function saveTraining(data: {
  id?: string
  institution: string
  degree: string | null
  field: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.id) {
    await prisma.training.update({
      where: { id: data.id },
      data: {
        institution: data.institution,
        degree: data.degree,
        field: data.field,
        startDate: data.startDate,
        endDate: data.current ? null : data.endDate,
        current: data.current,
        description: data.description,
      },
    })
  } else {
    await prisma.training.create({
      data: {
        ...data,
        wayfarerId: session.user.id,
      },
    })
  }

  revalidatePath('/manifest')
}

export async function deleteTraining(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.training.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function saveGear(data: {
  id?: string
  name: string
  category: string | null
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.id) {
    await prisma.gear.update({
      where: { id: data.id },
      data: {
        name: data.name,
        category: data.category,
        level: data.level,
      },
    })
  } else {
    await prisma.gear.create({
      data: {
        ...data,
        wayfarerId: session.user.id,
      },
    })
  }

  revalidatePath('/manifest')
}

export async function deleteGear(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.gear.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function saveLandmark(data: {
  id?: string
  name: string
  description: string | null
  url: string | null
  startDate: Date | null
  endDate: Date | null
  current: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.id) {
    await prisma.landmark.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        startDate: data.startDate,
        endDate: data.current ? null : data.endDate,
        current: data.current,
      },
    })
  } else {
    await prisma.landmark.create({
      data: {
        ...data,
        wayfarerId: session.user.id,
      },
    })
  }

  revalidatePath('/manifest')
}

export async function deleteLandmark(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.landmark.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function saveSummit(data: {
  id?: string
  title: string
  issuer: string | null
  date: Date | null
  description: string | null
  url: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.id) {
    await prisma.summit.update({
      where: { id: data.id },
      data: {
        title: data.title,
        issuer: data.issuer,
        date: data.date,
        description: data.description,
        url: data.url,
      },
    })
  } else {
    await prisma.summit.create({
      data: {
        ...data,
        wayfarerId: session.user.id,
      },
    })
  }

  revalidatePath('/manifest')
}

export async function deleteSummit(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.summit.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function savePathfinding(data: {
  id?: string
  organization: string
  role: string | null
  location: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.id) {
    await prisma.pathfinding.update({
      where: { id: data.id },
      data: {
        organization: data.organization,
        role: data.role,
        location: data.location,
        startDate: data.startDate,
        endDate: data.current ? null : data.endDate,
        current: data.current,
        description: data.description,
      },
    })
  } else {
    await prisma.pathfinding.create({
      data: {
        ...data,
        wayfarerId: session.user.id,
      },
    })
  }

  revalidatePath('/manifest')
}

export async function deletePathfinding(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.pathfinding.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function saveManifestSettings(data: {
  username: string | null
  defaultTerminology: 'CAIRN' | 'STANDARD'
  defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
  listed: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.username) {
    const existing = await prisma.wayfarer.findUnique({
      where: { username: data.username },
    })
    if (existing && existing.id !== session.user.id) {
      throw new Error('Username already taken')
    }
  }

  await prisma.wayfarer.update({
    where: { id: session.user.id },
    data: {
      username: data.username,
      defaultTerminology: data.defaultTerminology,
      defaultTheme: data.defaultTheme,
      listed: data.listed,
    },
  })

  revalidatePath('/manifest')
}

export async function saveCompanion({
  id,
  name,
  species,
  breed,
  birthday,
  bio,
  passed,
}: {
  id?: string
  name: string
  species: string
  breed?: string | null
  birthday?: Date | null
  bio?: string | null
  passed?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  if (id) {
    await prisma.companion.update({
      where: { id },
      data: { name, species, breed: breed ?? null, birthday: birthday ?? null, bio: bio ?? null, passed: passed ?? false },
    })
  } else {
    await prisma.companion.create({
      data: { name, species, breed: breed ?? null, birthday: birthday ?? null, bio: bio ?? null, passed: passed ?? false, wayfarerId },
    })
  }

  revalidatePath('/manifest')
}

export async function deleteCompanion(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const companion = await prisma.companion.findFirst({
    where: { id, wayfarerId: session.user.id },
    include: { media: true },
  })
  if (!companion) throw new Error('Not found')

  // Delete all media from R2
  await Promise.all(
    companion.media.map((m) =>
      r2Companions.send(new DeleteObjectCommand({ Bucket: R2_COMPANIONS_BUCKET, Key: m.key }))
    )
  )

  await prisma.companion.delete({ where: { id } })
  revalidatePath('/manifest')
}

export async function addCompanionMedia({
  companionId,
  key,
  type,
  caption,
  order,
}: {
  companionId: string
  key: string
  type: 'IMAGE' | 'VIDEO'
  caption?: string | null
  order?: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const companion = await prisma.companion.findFirst({
    where: { id: companionId, wayfarerId: session.user.id },
  })
  if (!companion) throw new Error('Not found')

  await prisma.companionMedia.create({
    data: { companionId, key, type, caption: caption ?? null, order: order ?? 0 },
  })

  revalidatePath('/manifest')
}

export async function updateCompanionMediaCaption(mediaId: string, caption: string | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const media = await prisma.companionMedia.findFirst({
    where: { id: mediaId, companion: { wayfarerId: session.user.id } },
  })
  if (!media) throw new Error('Not found')

  await prisma.companionMedia.update({
    where: { id: mediaId },
    data: { caption },
  })

  revalidatePath('/manifest')
}

export async function deleteCompanionMedia(mediaId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const media = await prisma.companionMedia.findFirst({
    where: { id: mediaId, companion: { wayfarerId: session.user.id } },
  })
  if (!media) throw new Error('Not found')

  await r2Companions.send(
    new DeleteObjectCommand({ Bucket: R2_COMPANIONS_BUCKET, Key: media.key })
  )

  await prisma.companionMedia.delete({ where: { id: mediaId } })
  revalidatePath('/manifest')
}