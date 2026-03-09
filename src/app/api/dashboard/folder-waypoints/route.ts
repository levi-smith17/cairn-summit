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
  const folderId = searchParams.get('folderId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '5')

  if (!folderId) {
    return NextResponse.json({ error: 'folderId required' }, { status: 400 })
  }

  const filters = parseFiltersFromParams(searchParams)
  const where = { ...buildWaypointWhere(filters, wayfarerId), folderId }
  const orderBy = buildWaypointOrderBy(filters.sort)

  const [waypoints, filteredCount] = await Promise.all([
    prisma.waypoint.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        logs: {
          include: { tags: { include: { tag: true } } },
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