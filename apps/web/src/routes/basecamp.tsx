import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { BasecampClient } from './basecamp/basecamp-client'
import { StudioPageSkeleton } from '@/components/studio/ui/studio-skeletons'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'
import { getBasecampSidebar } from '@/lib/api/basecamp'
import { getWaypoints } from '@/lib/api/waypoints'
import { getTrails } from '@/lib/api/trails'
import { getMarkers } from '@/lib/api/markers'
import { getLogs } from '@/lib/api/logs'
import { extractId } from '@/lib/utils'

const SIDEBAR_DEFAULTS = {
  wayfarer: { name: null, email: null, image: null, username: null, origins: null },
  manifestCounts: {
    expeditions: 0,
    training: 0,
    gear: 0,
    landmarks: 0,
    summits: 0,
    pathfinding: 0,
    companions: 0,
  },
  manifestHighlights: {
    totalYearsExperience: 0,
    mostRecentExpedition: null,
    mostRecentTraining: null,
    topGear: [],
  },
  provisionsSummary: {
    monthlyTotal: 0,
    monthlyBurn: 0,
    cacheTotalLimit: 0,
    cacheTotalSpent: 0,
    activeCount: 0,
    upcomingRenewals: 0,
  },
  itinerarySummary: { stops: [] },
  signalsSummary: { unreadCount: 0, latestMessages: [] },
}

export default function Basecamp() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const waypointsQuery = useQuery({
    queryKey: ['waypoints', user?.id],
    queryFn: getWaypoints,
    enabled: !!user,
  })

  const trailsQuery = useQuery({
    queryKey: ['trails', user?.id],
    queryFn: getTrails,
    enabled: !!user,
  })

  const markersQuery = useQuery({
    queryKey: ['markers', user?.id],
    queryFn: getMarkers,
    enabled: !!user,
  })

  const logsQuery = useQuery({
    queryKey: ['logs', user?.id],
    queryFn: getLogs,
    enabled: !!user,
  })

  const sidebarQuery = useQuery({
    queryKey: ['basecamp-sidebar'],
    queryFn: getBasecampSidebar,
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['waypoints'] })
    queryClient.invalidateQueries({ queryKey: ['trails'] })
    queryClient.invalidateQueries({ queryKey: ['markers'] })
    queryClient.invalidateQueries({ queryKey: ['logs'] })
    queryClient.invalidateQueries({ queryKey: ['basecamp-sidebar'] })
  }

  if (
    isInitialRouteLoad([
      waypointsQuery,
      trailsQuery,
      markersQuery,
      logsQuery,
      sidebarQuery,
    ])
  ) {
    return (
      <StudioPageSkeleton
        rail
        railRows={6}
        canvas={
          <div className="min-h-0 flex-1 space-y-6 overflow-hidden p-4 sm:p-6">
            <div className="space-y-3">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[8rem] animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          </div>
        }
      />
    )
  }

  const trails = (trailsQuery.data ?? []).map((t: any) => ({
    id: t.id ?? extractId(t.sk),
    name: t.name,
  }))

  const markers = (markersQuery.data ?? []).map((m: any) => ({
    id: m.id ?? extractId(m.sk),
    name: m.name,
    color: m.color,
    icon: m.icon ?? null,
  }))

  const waypoints = (waypointsQuery.data ?? []).map((w: any) => ({
    id: w.id ?? extractId(w.sk),
    title: w.title ?? '',
    url: w.url ?? '',
    favicon: w.favicon ?? null,
    trailId: w.trailId ?? null,
    markers: (w.markers ?? []).map((entry: any) => ({
      markerId: entry.markerId ?? entry.marker?.id ?? extractId(entry.marker?.sk),
      marker: {
        id: entry.marker?.id ?? entry.markerId,
        name: entry.marker?.name ?? '',
        color: entry.marker?.color ?? '#64748b',
        icon: entry.marker?.icon ?? null,
      },
    })),
    read: w.read ?? false,
  }))

  const logs = (logsQuery.data ?? []).map((l: any) => ({
    id: l.id ?? extractId(l.sk),
    title: l.title ?? null,
    content: l.content ?? '',
    trailId: l.trailId ?? null,
    createdAt: String(l.createdAt ?? ''),
    updatedAt: String(l.updatedAt ?? l.createdAt ?? ''),
  }))

  return (
    <BasecampClient
      waypoints={waypoints}
      trails={trails}
      markers={markers}
      logs={logs}
      sidebarData={sidebarQuery.data ?? SIDEBAR_DEFAULTS}
      onRefresh={onRefresh}
    />
  )
}
