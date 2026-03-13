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

  // Build folder where
  const folderWhere: any = { wayfarerId }
  if (filters.folderId !== 'all') {
    folderWhere.id = filters.folderId
  }

  // Build waypoint where for filtering folders
  const waypointWhere: any = { wayfarerId }
  if (filters.search) {
    waypointWhere.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { url: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  if (filters.tagId !== 'all') {
    waypointWhere.tags = { some: { tagId: filters.tagId } }
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
    prisma.folder.findMany({
      where: folderWhere,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        waypoints: {
          where: waypointWhere,
          orderBy: waypointOrderBy,
          take: WAYPOINTS_PER_FOLDER,
          include: {
            tags: { include: { tag: true } },
            logs: {
              include: { tags: { include: { tag: true } } },
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
            ...(filters.tagId !== 'all'
              ? { tags: { some: { tagId: filters.tagId } } }
              : {}),
          },
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { waypoints: true } },
      },
    }),
    prisma.folder.count({ where: folderWhere }),
  ])

  return NextResponse.json({
    folders,
    total,
    page,
    pageSize: PAGE_SIZE,
    hasMore: skip + PAGE_SIZE < total,
  })
}