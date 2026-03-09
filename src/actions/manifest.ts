'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveOrigins(data: {
  headline: string | null
  summary: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.origins.upsert({
    where: { wayfarerId: session.user.id },
    update: data,
    create: { ...data, wayfarerId: session.user.id },
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