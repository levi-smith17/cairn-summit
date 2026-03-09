import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildLogWhere, buildLogOrderBy } from '@/lib/filters'
import { LogActions } from './components/log-actions'
import { LogClient } from './components/log-client'
import { PageHeader } from '@/components/nav/page-header'
import { FilterBar } from '@/components/filters/filter-bar'

interface LogPageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function LogPage({ searchParams }: LogPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const params = new URLSearchParams(await searchParams)
  const filters = parseFiltersFromParams(params)
  const where = buildLogWhere(filters, wayfarerId)
  const orderBy = buildLogOrderBy(filters.sort)

  const [logs, tags, folders, waypoints] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        folder: true,
        waypoint: true,
        tags: { include: { tag: true } },
      },
      orderBy,
    }),
    prisma.tag.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.folder.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.waypoint.findMany({ where: { wayfarerId }, orderBy: { title: 'asc' } }),
  ])

  return (
    <>
      <PageHeader
        title="Log"
        filters={
          <FilterBar
            tags={tags}
            folders={folders}
            showFolderFilter
            showTagFilter
            showSort
            showUnattached
            showDateRange
            searchPlaceholder="Search entries..."
          />
        }
        actions={<LogActions folders={folders} waypoints={waypoints} tags={tags} />}
      />
      <div className="flex flex-col flex-1 p-4 min-w-0 overflow-hidden">
        <LogClient
          logs={logs}
          folders={folders}
          waypoints={waypoints}
          tags={tags}
        />
      </div>
    </>
  )
}