import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { parseFiltersFromParams, buildWaypointWhere, buildWaypointOrderBy } from '@/lib/filters'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const wayfarerId = session.user.id

  const searchParams = req.nextUrl.searchParams
  const trailId = searchParams.get('trailId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '5')

  if (!trailId) {
    return NextResponse.json({ error: 'trailId required' }, { status: 400 })
  }

  const filters = parseFiltersFromParams(searchParams)
  const where = { ...buildWaypointWhere(filters, wayfarerId), trailId }
  const orderBy = buildWaypointOrderBy(filters.sort)

  const [waypoints, filteredCount] = await Promise.all([
    prisma.waypoint.findMany({
      where,
      include: {
        markers: { include: { marker: true } },
        logs: {
          include: { markers: { include: { marker: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.waypoint.count({ where }),
  ])

  return NextResponse.json({ waypoints, filteredCount })
}
