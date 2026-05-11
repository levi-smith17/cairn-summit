import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { BasecampClient } from './basecamp/basecamp-client'
import { getBasecampData } from '@/lib/api/basecamp'

const DEFAULTS = {
  folders: [],
  hasMore: false,
  tags: [],
  allFolders: [],
  filteredCountMap: null,
  sidebarData: {
    wayfarer: { name: null, email: null, image: null, username: null, origins: null },
    manifestCounts: { expeditions: 0, training: 0, gear: 0, landmarks: 0, summits: 0, pathfinding: 0, companions: 0 },
    manifestHighlights: { totalYearsExperience: 0, mostRecentExpedition: null, mostRecentTraining: null, topGear: [] },
    provisionsSummary: { monthlyTotal: 0, monthlyBurn: 0, cacheTotalLimit: 0, cacheTotalSpent: 0, activeCount: 0, upcomingRenewals: 0 },
    signalsSummary: { unreadCount: 0, latestMessages: [], emailAccounts: [] },
    itinerarySummary: { stops: [] },
  },
}

export default function Basecamp() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const { data } = useQuery({
    queryKey: ['basecamp', searchParams.toString()],
    queryFn: () => getBasecampData(searchParams.toString()),
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['basecamp'] })
  }

  return (
    <BasecampClient
      initialFolders={data?.folders ?? DEFAULTS.folders}
      initialHasMore={data?.hasMore ?? DEFAULTS.hasMore}
      tags={data?.tags ?? DEFAULTS.tags}
      folders={data?.allFolders ?? DEFAULTS.allFolders}
      filteredCountMap={data?.filteredCountMap ?? DEFAULTS.filteredCountMap}
      sidebarData={data?.sidebarData ?? DEFAULTS.sidebarData}
      onRefresh={onRefresh}
    />
  )
}
