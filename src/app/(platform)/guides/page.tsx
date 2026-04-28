import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuidesClient } from './components/guides-client'

const PAGE_SIZE = 25

interface GuidesPageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const params = new URLSearchParams(await searchParams)
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const [guides, totalCount, trails, markers] = await Promise.all([
    prisma.guide.findMany({
      where: { wayfarerId },
      include: {
        trail: true,
        stones: {
          include: {
            markers: { include: { marker: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.guide.count({ where: { wayfarerId } }),
    prisma.trail.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  return <GuidesClient guides={guides} trails={trails} markers={markers} totalCount={totalCount} currentPage={page} pageSize={PAGE_SIZE} />
}
