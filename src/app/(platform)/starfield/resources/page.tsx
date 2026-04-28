import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ResourcesClient } from './components/resources-client'

const PAGE_SIZE = 25

interface ResourcesPageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = new URLSearchParams(await searchParams)
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const [resources, totalCount, resourceTypes] = await Promise.all([
    prisma.sfResource.findMany({
      orderBy: [{ type: { name: 'asc' } }, { name: 'asc' }],
      take: PAGE_SIZE,
      skip,
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
    prisma.sfResource.count(),
    prisma.sfResourceType.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <ResourcesClient
      resources={resources}
      resourceTypes={resourceTypes}
      totalCount={totalCount}
      currentPage={page}
      pageSize={PAGE_SIZE}
    />
  )
}
