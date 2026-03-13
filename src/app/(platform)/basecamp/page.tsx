import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildFolderOrderBy, buildWaypointOrderBy } from '@/lib/filters'
import { BasecampClient } from './components/basecamp-client'

const PAGE_SIZE = 15
const WAYPOINTS_PER_FOLDER = 10

const cycleToMonths: Record<string, number> = {
  WEEKLY: 1 / 4.33,
  BIWEEKLY: 1 / 2.17,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  ANNUALLY: 1 / 12,
}

interface BasecampPageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function BasecampPage({ searchParams }: BasecampPageProps) {
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

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    folders,
    totalFolders,
    tags,
    allFolders,
    allWaypoints,
    wayfarer,
    expeditions,
    trainingList,
    gear,
    landmarkCount,
    summitCount,
    pathfindingCount,
    companionCount,
    activeProvisions,
    upcomingRenewals,
    unreadSignals,
    latestSignals,
  ] = await Promise.all([
    // Main waypoint data
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
    prisma.waypoint.findMany({ where: { wayfarerId }, orderBy: { title: 'asc' }, select: { id: true, title: true, folderId: true } }),

    // Sidebar: Wayfarer + origins
    prisma.wayfarer.findUnique({
      where: { id: wayfarerId },
      select: {
        name: true,
        image: true,
        username: true,
        origins: { select: { headline: true, location: true, website: true, linkedin: true, github: true } },
      },
    }),

    // Sidebar: Manifest highlights + counts
    prisma.expedition.findMany({ where: { wayfarerId }, select: { title: true, company: true, current: true, startDate: true, endDate: true }, orderBy: { startDate: 'desc' } }),
    prisma.training.findMany({ where: { wayfarerId }, select: { institution: true, degree: true }, orderBy: { startDate: 'desc' } }),
    prisma.gear.findMany({ where: { wayfarerId }, select: { name: true, level: true }, orderBy: { name: 'asc' } }),
    prisma.landmark.count({ where: { wayfarerId } }),
    prisma.summit.count({ where: { wayfarerId } }),
    prisma.pathfinding.count({ where: { wayfarerId } }),
    prisma.companion.count({ where: { wayfarerId } }),

    // Sidebar: Provisions
    prisma.provision.findMany({ where: { wayfarerId, active: true }, select: { amount: true, billingCycle: true } }),
    prisma.provision.count({ where: { wayfarerId, active: true, nextRenewal: { gte: now, lte: in7Days } } }),

    // Sidebar: Signals
    prisma.message.count({ where: { wayfarerId, read: false } }),
    prisma.message.findMany({
      where: { wayfarerId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, senderName: true, body: true, createdAt: true },
    }),
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

  const monthlyTotal = activeProvisions.reduce((sum: number, p: { amount: number; billingCycle: string }) => {
    return sum + p.amount * (cycleToMonths[p.billingCycle] ?? 1)
  }, 0)

  return (
    <BasecampClient
      initialFolders={folders}
      initialHasMore={PAGE_SIZE < totalFolders}
      tags={tags}
      folders={allFolders}
      waypoints={allWaypoints}
      filteredCountMap={filteredCountMap}
      sidebarData={{
        wayfarer: {
          ...(wayfarer ?? { name: null, image: null, username: null, origins: null }),
          email: session.user.email ?? null,
        },
        manifestCounts: {
          expeditions: expeditions.length,
          training: trainingList.length,
          gear: gear.length,
          landmarks: landmarkCount,
          summits: summitCount,
          pathfinding: pathfindingCount,
          companions: companionCount,
        },
        manifestHighlights: {
          totalYearsExperience: expeditions.reduce((total: number, exp: { startDate: Date; endDate: Date | null; current: boolean }) => {
            const start = new Date(exp.startDate)
            const end = exp.current ? new Date() : exp.endDate ? new Date(exp.endDate) : new Date()
            return total + (end.getFullYear() - start.getFullYear())
          }, 0),
          mostRecentExpedition: expeditions[0] ? { title: expeditions[0].title, company: expeditions[0].company } : null,
          mostRecentTraining: trainingList[0] ? { institution: trainingList[0].institution, degree: trainingList[0].degree } : null,
          topGear: gear.slice(0, 3).map((g: { name: string; level: string | null }) => ({ name: g.name })),
        },
        provisionsSummary: {
          monthlyTotal,
          activeCount: activeProvisions.length,
          upcomingRenewals,
        },
        signalsSummary: {
          unreadCount: unreadSignals,
          latestMessages: latestSignals,
        },
      }}
    />
  )
}
