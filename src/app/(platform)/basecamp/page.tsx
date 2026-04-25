import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseFiltersFromParams, buildFolderOrderBy, buildWaypointOrderBy } from '@/lib/filters'
import { BasecampClient } from './components/basecamp-client'

const PAGE_SIZE = 15
const WAYPOINTS_PER_FOLDER = 10

function provisionAmountForMonth(
  billingCycle: string,
  amount: number,
  nextRenewal: Date,
  monthStart: Date,
  monthEnd: Date
): number {
  if (billingCycle === 'QUARTERLY' || billingCycle === 'ANNUALLY') {
    if (nextRenewal >= monthStart && nextRenewal <= monthEnd) return amount
    const prev = new Date(nextRenewal)
    if (billingCycle === 'QUARTERLY') prev.setMonth(prev.getMonth() - 3)
    else prev.setFullYear(prev.getFullYear() - 1)
    if (prev >= monthStart && prev <= monthEnd) return amount
    return 0
  }
  const cycleToMonths: Record<string, number> = { WEEKLY: 1 / 4.33, BIWEEKLY: 1 / 2.17, MONTHLY: 1 }
  return amount * (cycleToMonths[billingCycle] ?? 1)
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
  if (filters.markerIds.length > 0) waypointWhere.markers = { some: { markerId: { in: filters.markerIds } } }
  if (filters.readLater) waypointWhere.readLater = true
  const hasWaypointFilter = !!(filters.search || filters.markerIds.length > 0 || filters.readLater || filters.dateFrom || filters.dateTo)

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthStart = new Date(currentYear, currentMonth - 1, 1)
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  const [
    trails,
    totalTrails,
    markers,
    allTrails,
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
    monthExpenseAgg,
    currentBudgets,
    itineraryStops,
    unreadSignals,
    latestSignals,
    imapAccountsWithCounts,
  ] = await Promise.all([
    // Main waypoint data
    prisma.trail.findMany({
      where: {
        wayfarerId,
        ...(filters.trailId !== 'all' ? { id: filters.trailId } : {}),
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
            markers: { include: { marker: true } },
            logs: {
              include: { markers: { include: { marker: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        logs: {
          where: { wayfarerId, waypointId: null },
          include: { markers: { include: { marker: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { waypoints: true } },
      },
    }),
    prisma.trail.count({
      where: {
        wayfarerId,
        ...(filters.trailId !== 'all' ? { id: filters.trailId } : {}),
        ...(hasWaypointFilter ? { waypoints: { some: waypointWhere } } : {}),
      },
    }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.trail.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.waypoint.findMany({ where: { wayfarerId }, orderBy: { title: 'asc' }, select: { id: true, title: true, trailId: true } }),

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
    prisma.provision.findMany({ where: { wayfarerId, active: true }, select: { amount: true, billingCycle: true, nextRenewal: true } }),
    prisma.provision.count({ where: { wayfarerId, active: true, nextRenewal: { gte: now, lte: in7Days } } }),
    prisma.expense.aggregate({ where: { wayfarerId, date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
    prisma.budget.findMany({ where: { wayfarerId, month: currentMonth, year: currentYear }, select: { limit: true } }),

    // Sidebar: Itinerary (today + next 3 days)
    prisma.stop.findMany({
      where: {
        wayfarerId,
        startDate: { lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4) },
        OR: [
          { endDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
          { endDate: null, startDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        ],
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true, title: true, startDate: true, endDate: true, allDay: true,
        recurrenceRule: true, masterStopId: true,
        markers: { select: { marker: { select: { color: true } } } },
      },
    }),

    // Sidebar: Signals
    prisma.signal.count({ where: { wayfarerId, read: false } }),
    prisma.signal.findMany({
      where: { wayfarerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, senderName: true, body: true, createdAt: true, read: true },
    }),
    prisma.imapAccount.findMany({
      where: { wayfarerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, label: true, emailAddress: true, isDefault: true,
        cachedEmails: { where: { isRead: false, mailbox: 'INBOX' }, select: { id: true } },
      },
    }),
  ])

  const filteredCounts = hasWaypointFilter
    ? await prisma.waypoint.groupBy({
        by: ['trailId'],
        where: waypointWhere,
        _count: true,
      })
    : null

  const filteredCountMap = filteredCounts
    ? Object.fromEntries(filteredCounts.map(r => [r.trailId, r._count]))
    : null

  const monthlyTotal = activeProvisions.reduce((sum: number, p: { amount: number; billingCycle: string; nextRenewal: Date }) => {
    return sum + provisionAmountForMonth(p.billingCycle, p.amount, new Date(p.nextRenewal), monthStart, monthEnd)
  }, 0)
  const monthlyBurn = monthExpenseAgg._sum.amount ?? 0
  const cacheTotalLimit = currentBudgets.reduce((s: number, b: { limit: number }) => s + b.limit, 0)

  return (
    <BasecampClient
      initialFolders={trails}
      initialHasMore={PAGE_SIZE < totalTrails}
      tags={markers}
      folders={allTrails}
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
          monthlyBurn,
          cacheTotalLimit,
          cacheTotalSpent: monthlyTotal + monthlyBurn,
          activeCount: activeProvisions.length,
          upcomingRenewals,
        },
        signalsSummary: {
          unreadCount: unreadSignals,
          latestMessages: latestSignals,
          emailAccounts: imapAccountsWithCounts.map(a => ({
            id: a.id,
            label: a.label,
            emailAddress: a.emailAddress,
            unreadCount: a.cachedEmails.length,
          })),
        },
        itinerarySummary: {
          stops: itineraryStops.map(s => ({
            id: s.id,
            title: s.title,
            startDate: s.startDate,
            endDate: s.endDate,
            allDay: s.allDay,
            color: s.markers[0]?.marker.color ?? '#6b7280',
          })),
        },
      }}
    />
  )
}
