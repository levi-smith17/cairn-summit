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

  const [waypoints, markers, trails] = await Promise.all([
    prisma.waypoint.findMany({
      where,
      include: {
        trail: true,
        markers: { include: { marker: true } },
      },
      orderBy,
    }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.trail.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  return <WaypointsClient waypoints={waypoints} trails={trails} markers={markers} />
}
