import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  parseFiltersFromParams,
  buildWaypointOrderBy,
  buildFolderOrderBy,
} from '@/lib/filters'

const PAGE_SIZE = 15
const WAYPOINTS_PER_FOLDER = 5

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const wayfarerId = session.user.id

  const searchParams = req.nextUrl.searchParams
  const filters = parseFiltersFromParams(searchParams)
  const page = parseInt(searchParams.get('page') ?? '1')
  const skip = (page - 1) * PAGE_SIZE

  // Build trail where
  const trailWhere: any = { wayfarerId }
  if (filters.trailId !== 'all') {
    trailWhere.id = filters.trailId
  }

  // Build waypoint where for filtering trails
  const waypointWhere: any = { wayfarerId }
  if (filters.search) {
    waypointWhere.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { url: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  if (filters.markerIds.length > 0) {
    waypointWhere.markers = { some: { markerId: { in: filters.markerIds } } }
  }
  if (filters.readLater) {
    waypointWhere.readLater = true
  }
  if (filters.dateFrom || filters.dateTo) {
    waypointWhere.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    }
  }

  const orderBy = buildFolderOrderBy(filters.sort)
  const waypointOrderBy = buildWaypointOrderBy(filters.sort)

  const [folders, total] = await Promise.all([
    prisma.trail.findMany({
      where: trailWhere,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        waypoints: {
          where: waypointWhere,
          orderBy: waypointOrderBy,
          take: WAYPOINTS_PER_FOLDER,
          include: {
            markers: { include: { marker: true } },
            logs: {
              include: { markers: { include: { marker: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        logs: {
          where: {
            wayfarerId,
            waypointId: null,
            ...(filters.search
              ? { content: { contains: filters.search, mode: 'insensitive' } }
              : {}),
            ...(filters.markerIds.length > 0
              ? { markers: { some: { markerId: { in: filters.markerIds } } } }
              : {}),
          },
          include: { markers: { include: { marker: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { waypoints: true } },
      },
    }),
    prisma.trail.count({ where: trailWhere }),
  ])

  return NextResponse.json({
    folders,
    total,
    page,
    pageSize: PAGE_SIZE,
    hasMore: skip + PAGE_SIZE < total,
  })
}
