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

  return <LogClient logs={logs} tags={tags} folders={folders} waypoints={waypoints} />
}
