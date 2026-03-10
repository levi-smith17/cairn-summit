import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FacilitiesClient } from './components/facilities-client'

export default async function StarfieldPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [facilities, resources, systems] = await Promise.all([
    prisma.sfFacility.findMany({
      orderBy: { abbreviation: 'asc' },
      include: {
        planet: { include: { system: true } },
        resources: {
          orderBy: { resource: { name: 'asc' } },
          include: {
            resource: { include: { type: true } },
            planet: { include: { system: true } },
            subfacility1: { include: { system: true } },
            subfacility2: { include: { system: true } },
            subfacility3: { include: { system: true } },
            relay: { include: { system: true } },
          },
        },
      },
    }),
    prisma.sfResource.findMany({
      orderBy: { name: 'asc' },
      include: { type: true },
    }),
    prisma.sfSystem.findMany({
      orderBy: { name: 'asc' },
      include: { planets: { orderBy: { name: 'asc' } } },
    }),
  ])

  return (
    <FacilitiesClient
      facilities={facilities}
      resources={resources}
      systems={systems}
    />
  )
}