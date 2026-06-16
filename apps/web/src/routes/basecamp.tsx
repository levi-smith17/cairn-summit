import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology } from '@/contexts/terminology-context'
import { BasecampClient } from './basecamp/basecamp-client'
import { BasecampSkeleton } from '@/components/ui/page-skeleton'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'
import { getBasecamp, getBasecampSidebar, type BasecampParams } from '@/lib/api/basecamp'

const SIDEBAR_DEFAULTS = {
  wayfarer: { name: null, email: null, image: null, username: null, origins: null },
  manifestCounts: { expeditions: 0, training: 0, gear: 0, landmarks: 0, summits: 0, pathfinding: 0, companions: 0 },
  manifestHighlights: { totalYearsExperience: 0, mostRecentExpedition: null, mostRecentTraining: null, topGear: [] },
  provisionsSummary: { monthlyTotal: 0, monthlyBurn: 0, cacheTotalLimit: 0, cacheTotalSpent: 0, activeCount: 0, upcomingRenewals: 0 },
  itinerarySummary: { stops: [] },
  signalsSummary: { unreadCount: 0, latestMessages: [] },
}

export default function Basecamp() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const mainQuery = useQuery({
    queryKey: ['basecamp', searchParams.toString()],
    queryFn: () => getBasecamp(Object.fromEntries(searchParams) as BasecampParams),
    enabled: !!user,
    placeholderData: keepPreviousData,
  })

  const sidebarQuery = useQuery({
    queryKey: ['basecamp-sidebar'],
    queryFn: getBasecampSidebar,
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['basecamp'] })
    queryClient.invalidateQueries({ queryKey: ['basecamp-sidebar'] })
  }

  if (isInitialRouteLoad([mainQuery, sidebarQuery])) {
    return <BasecampSkeleton title={terms.basecamp} />
  }

  const data = mainQuery.data

  return (
    <BasecampClient
      initialFolders={data?.folders ?? []}
      initialHasMore={data?.hasMore ?? false}
      tags={data?.tags ?? []}
      folders={data?.allFolders ?? []}
      filteredCountMap={data?.filteredCountMap ?? null}
      sidebarData={sidebarQuery.data ?? SIDEBAR_DEFAULTS}
      onRefresh={onRefresh}
    />
  )
}
