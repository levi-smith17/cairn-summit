import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildLogWhere, buildLogOrderBy } from '@/lib/filters'
import { LogClient } from './components/logs-client'

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

  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10))
  const logbookTrailId = params.get('logbook')

  const [logSettings, markers, trails, waypoints] = await Promise.all([
    prisma.logSettings.findUnique({
      where: { wayfarerId },
      select: { logsPerPage: true, defaultSort: true },
    }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.trail.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.waypoint.findMany({ where: { wayfarerId }, orderBy: { title: 'asc' } }),
  ])

  const logsPerPage = logSettings?.logsPerPage ?? 25
  const skip = (page - 1) * logsPerPage

  const [logs, totalCount, logbookTrailLogs] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        trail: true,
        waypoint: true,
        markers: { include: { marker: true } },
      },
      orderBy,
      take: logsPerPage,
      skip,
    }),
    prisma.log.count({ where }),
    logbookTrailId
      ? prisma.log.findMany({
          where: { trailId: logbookTrailId, wayfarerId },
          include: {
            trail: true,
            waypoint: true,
            markers: { include: { marker: true } },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        })
      : Promise.resolve([]),
  ])

  return (
    <LogClient
      logs={logs}
      logbookTrailLogs={logbookTrailLogs}
      markers={markers}
      trails={trails}
      waypoints={waypoints}
      totalCount={totalCount}
      currentPage={page}
      logsPerPage={logsPerPage}
    />
  )
}
