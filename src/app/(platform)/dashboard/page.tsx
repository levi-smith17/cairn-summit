import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildFolderOrderBy, buildWaypointOrderBy } from '@/lib/filters'
import { DashboardActions } from './components/dashboard-actions'
import { DashboardClient } from './components/dashboard-client'
import { PageHeader } from '@/components/nav/page-header'
import { FilterBar } from '@/components/filters/filter-bar'

const PAGE_SIZE = 15
const WAYPOINTS_PER_FOLDER = 5

interface DashboardPageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const params = new URLSearchParams(await searchParams)
  const filters = parseFiltersFromParams(params)
  const orderBy = buildFolderOrderBy(filters.sort)
  const waypointOrderBy = buildWaypointOrderBy(filters.sort)

  const waypointWhere: any = { wayfarerId }
  if (filters.search) {
    waypointWhere.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { url: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  if (filters.tagId !== 'all') waypointWhere.tags = { some: { tagId: filters.tagId } }
  if (filters.readLater) waypointWhere.readLater = true
  const hasWaypointFilter = !!(filters.search || filters.tagId !== 'all' || filters.readLater || filters.dateFrom || filters.dateTo)
  //if (filters.folderId !== 'all') waypointWhere.folderId = filters.folderId

  const [folders, totalFolders, tags, allFolders] = await Promise.all([
    prisma.folder.findMany({
      where: {
        wayfarerId,
        ...(filters.folderId !== 'all' ? { id: filters.folderId } : {}),
        ...(hasWaypointFilter ? { waypoints: { some: waypointWhere } } : {}),
      },
      orderBy,
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
          where: { wayfarerId, waypointId: null },
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { waypoints: true } },
      },
    }),
    prisma.folder.count({
      where: {
        wayfarerId,
        ...(filters.folderId !== 'all' ? { id: filters.folderId } : {}),
        ...(hasWaypointFilter ? { waypoints: { some: waypointWhere } } : {}),
      },
    }),
    prisma.tag.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.folder.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const filteredCounts = hasWaypointFilter
  ? await prisma.waypoint.groupBy({
      by: ['folderId'],
      where: waypointWhere,
      _count: true,
    })
  : null

  const filteredCountMap = filteredCounts
  ? Object.fromEntries(filteredCounts.map(r => [r.folderId, r._count]))
  : null

  return (
    <>
      <PageHeader
        title="Dashboard"
        filters={
          <FilterBar
            tags={tags}
            folders={allFolders}
            showFolderFilter
            showTagFilter
            showSort
            showReadLater
            showDateRange
            searchPlaceholder="Search waypoints and notes..."
          />
        }
        actions={<DashboardActions folders={allFolders} tags={tags} />}
      />
      <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
        <DashboardClient
          initialFolders={folders}
          initialHasMore={PAGE_SIZE < totalFolders}
          tags={tags}
          folders={allFolders}
          filteredCountMap={filteredCountMap}
        />
      </div>
    </>
  )
}