import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildWaypointWhere, buildWaypointOrderBy } from '@/lib/filters'
import { WaypointsClient } from './components/waypoints-client'
import { WaypointsActions } from './components/waypoints-actions'
import { PageHeader } from '@/components/nav/page-header'
import { FilterBar } from '@/components/filters/filter-bar'

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

  const [waypoints, tags, folders] = await Promise.all([
    prisma.waypoint.findMany({
      where,
      include: {
        folder: true,
        tags: { include: { tag: true } },
      },
      orderBy,
    }),
    prisma.tag.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.folder.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  return (
    <>
      <PageHeader
        title="Waypoints"
        filters={
          <FilterBar
            tags={tags}
            folders={folders}
            showFolderFilter
            showTagFilter
            showSort
            showReadLater
            showDateRange
            searchPlaceholder="Search waypoints..."
          />
        }
        actions={<WaypointsActions folders={folders} tags={tags} />}
      />
      <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
        <WaypointsClient
          waypoints={waypoints}
          folders={folders}
          tags={tags}
        />
      </div>
    </>
  )
}