import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ResourcesClient } from './components/resources-client'

export default async function ResourcesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [resources, resourceTypes] = await Promise.all([
    prisma.sfResource.findMany({
      orderBy: [{ type: { name: 'asc' } }, { name: 'asc' }],
      include: {
        type: true,
        resource1: true,
        resource2: true,
        resource3: true,
        resource4: true,
        facilityResources: {
          include: {
            facility: { include: { planet: { include: { system: true } } } },
            planet: { include: { system: true } },
          },
          orderBy: { facility: { abbreviation: 'asc' } },
        },
      },
    }),
    prisma.sfResourceType.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <ResourcesClient resources={resources} resourceTypes={resourceTypes} />
}
