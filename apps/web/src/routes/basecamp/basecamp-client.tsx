import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { FilterBar } from '@/components/filters/filter-bar'
import { useTerminology } from '@/contexts/terminology-context'
import { TrailSection } from './trail-section'
import { SnapshotPanels } from './snapshot-panels'
import { InlineWaypointForm } from './inline-waypoint-form'

const API_BASE = import.meta.env.VITE_API_URL

interface SnapshotData {
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
    username: string | null
    origins: { headline: string | null; location: string | null; website: string | null; linkedin: string | null; github: string | null } | null
  }
  manifestCounts: {
    expeditions: number
    training: number
    gear: number
    landmarks: number
    summits: number
    pathfinding: number
    companions: number
  }
  manifestHighlights: {
    totalYearsExperience: number
    mostRecentExpedition: { title: string; company: string } | null
    mostRecentTraining: { institution: string; degree: string | null } | null
    topGear: { name: string }[]
  }
  provisionsSummary: {
    monthlyTotal: number
    monthlyBurn: number
    cacheTotalLimit: number
    cacheTotalSpent: number
    activeCount: number
    upcomingRenewals: number
  }
  signalsSummary: {
    unreadCount: number
    latestMessages: { id: string; senderName: string; body: string; createdAt: Date | string; read: boolean }[]
    emailAccounts: { id: string; label: string; emailAddress: string; unreadCount: number }[]
  }
  itinerarySummary: {
    stops: { id: string; title: string; startDate: Date | string; endDate: Date | string | null; allDay: boolean; color: string }[]
  }
}

interface BasecampClientProps {
  initialFolders: any[]
  initialHasMore: boolean
  tags: any[]
  folders: any[]
  filteredCountMap: Record<string, number> | null
  sidebarData: SnapshotData
  onRefresh: () => void
}

export function BasecampClient({
  initialFolders,
  initialHasMore,
  tags,
  folders,
  filteredCountMap,
  sidebarData,
  onRefresh,
}: BasecampClientProps) {
  const { terms } = useTerminology()
  const [searchParams] = useSearchParams()
  const searchParamsStr = searchParams.toString()

  const [extraTrails, setExtraTrails] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [addingWaypoint, setAddingWaypoint] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevSearchParamsStr = useRef(searchParamsStr)
  const prevInitialFolders = useRef(initialFolders)

  if (prevSearchParamsStr.current !== searchParamsStr) {
    prevSearchParamsStr.current = searchParamsStr
    setExtraTrails([])
    setHasMore(initialHasMore)
    setPage(1)
  }

  if (prevInitialFolders.current !== initialFolders) {
    prevInitialFolders.current = initialFolders
    setExtraTrails([])
    setHasMore(initialHasMore)
    setPage(1)
  }

  const loadedTrails = [...initialFolders, ...extraTrails]

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', nextPage.toString())
      const res = await fetch(`${API_BASE}/basecamp?${params.toString()}`)
      const data = await res.json()
      setExtraTrails(prev => [...prev, ...data.folders])
      setHasMore(data.hasMore)
      setPage(nextPage)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, searchParams])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <>
      <PlatformHeader title={terms.basecamp} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-y-auto lg:overflow-hidden lg:min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <FilterBar
            markers={tags}
            trails={folders}
            showTrailFilter
            showMarkerFilter
            showSort
            showReadLater
            showDateRange
            searchPlaceholder={`${terms.explore} ${terms.waypoints.toLowerCase()}...`}
            fill
          />
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:overflow-hidden lg:min-h-0">
          <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card lg:overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <span className="text-sm font-medium text-muted-foreground">
                {loadedTrails.length} {loadedTrails.length !== 1 ? terms.trails.toLowerCase() : terms.trails.slice(0, -1).toLowerCase()}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setAddingWaypoint(v => !v)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add {terms.waypoints.slice(0, -1).toLowerCase()}</TooltipContent>
              </Tooltip>
            </div>

            {addingWaypoint && (
              <InlineWaypointForm
                folders={folders}
                tags={tags}
                onCancel={() => setAddingWaypoint(false)}
                onSaved={() => { setAddingWaypoint(false); onRefresh() }}
              />
            )}

            <div className="lg:flex-1 lg:overflow-y-auto">
              {loadedTrails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No {terms.waypoints.toLowerCase()} yet.{' '}
                    <button
                      onClick={() => setAddingWaypoint(true)}
                      className="text-primary hover:underline"
                    >
                      Add one to get started.
                    </button>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {loadedTrails.map((trail: any) => (
                    <TrailSection
                      key={trail.id}
                      trail={trail}
                      waypoints={trail.waypoints ?? []}
                      logCount={trail._count?.logs ?? 0}
                      tags={tags}
                      folders={folders}
                      totalWaypointCount={
                        filteredCountMap
                          ? (filteredCountMap[trail.id] ?? 0)
                          : (trail._count?.waypoints ?? 0)
                      }
                      onRefresh={onRefresh}
                    />
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="h-4" />

              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-72 lg:shrink-0 overflow-y-auto">
            <SnapshotPanels {...sidebarData} />
          </div>
        </div>
      </div>
    </>
  )
}
