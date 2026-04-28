import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildWaypointWhere, buildWaypointOrderBy } from '@/lib/filters'
import { WaypointsClient } from './components/waypoints-client'

interface WaypointsPageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function WaypointsPage({ searchParams }: WaypointsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const params = new URLSearchParams(await searchParams)
  const filters = parseFiltersFromParams(params)
  const where = buildWaypointWhere(filters, wayfarerId)
  const orderBy = buildWaypointOrderBy(filters.sort)

  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10))

  const [waypointSettings, markers, trails] = await Promise.all([
    prisma.waypointSettings.findUnique({
      where: { wayfarerId },
      select: { waypointsPerPage: true },
    }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.trail.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  const waypointsPerPage = waypointSettings?.waypointsPerPage ?? 25
  const skip = (page - 1) * waypointsPerPage

  const [waypoints, totalCount] = await Promise.all([
    prisma.waypoint.findMany({
      where,
      include: {
        trail: true,
        markers: { include: { marker: true } },
      },
      orderBy,
      take: waypointsPerPage,
      skip,
    }),
    prisma.waypoint.count({ where }),
  ])

  return (
    <WaypointsClient
      waypoints={waypoints}
      trails={trails}
      markers={markers}
      totalCount={totalCount}
      currentPage={page}
      waypointsPerPage={waypointsPerPage}
    />
  )
}
