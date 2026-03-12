'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FileText, Loader2, Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { FilterBar } from '@/components/filters/filter-bar'
import { useTerminology } from '@/contexts/terminology-context'
import { TrailSection } from './trail-section'
import { SnapshotPanels } from './snapshot-panels'
import { InlineWaypointForm } from './inline-waypoint-form'
import { InlineLogForm } from './inline-log-form'

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
    activeCount: number
    upcomingRenewals: number
  }
  signalsSummary: {
    unreadCount: number
    latestMessages: { id: string; senderName: string; body: string; createdAt: Date | string }[]
  }
}

interface DashboardClientProps {
  initialFolders: any[]
  initialHasMore: boolean
  tags: any[]
  folders: any[]
  waypoints: any[]
  filteredCountMap: Record<string, number> | null
  sidebarData: SnapshotData
}

export function DashboardClient({
  initialFolders,
  initialHasMore,
  tags,
  folders,
  waypoints,
  filteredCountMap,
  sidebarData,
}: DashboardClientProps) {
  const { terms } = useTerminology()
  const searchParams = useSearchParams()
  const searchParamsStr = searchParams.toString()

  const [extraTrails, setExtraTrails] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [addingWaypoint, setAddingWaypoint] = useState(false)
  const [addingLog, setAddingLog] = useState(false)

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
      const res = await fetch(`/api/dashboard?${params.toString()}`)
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
        {/* Filter bar panel */}
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
          {/* Left — unified trail panel */}
          <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-border bg-card lg:overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <span className="text-sm font-medium text-muted-foreground">
                {loadedTrails.length} {loadedTrails.length !== 1 ? terms.trails.toLowerCase() : terms.trails.slice(0, -1).toLowerCase()}
              </span>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setAddingLog(v => !v); setAddingWaypoint(false) }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add {terms.logs.slice(0, -1).toLowerCase()}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setAddingWaypoint(v => !v); setAddingLog(false) }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add {terms.waypoints.slice(0, -1).toLowerCase()}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Global inline add forms */}
            {addingWaypoint && (
              <InlineWaypointForm
                folders={folders}
                tags={tags}
                onCancel={() => setAddingWaypoint(false)}
                onSaved={() => setAddingWaypoint(false)}
              />
            )}
            {addingLog && (
              <InlineLogForm
                folders={folders}
                waypoints={waypoints}
                tags={tags}
                onCancel={() => setAddingLog(false)}
                onSaved={() => setAddingLog(false)}
              />
            )}

            {/* Scrollable trail list */}
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
                      folderLogs={trail.logs ?? []}
                      tags={tags}
                      folders={folders}
                      allWaypoints={waypoints}
                      totalWaypointCount={
                        filteredCountMap
                          ? (filteredCountMap[trail.id] ?? 0)
                          : (trail._count?.waypoints ?? 0)
                      }
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

          {/* Right — sidebar panels */}
          <div className="lg:w-72 lg:shrink-0 overflow-y-auto">
            <SnapshotPanels {...sidebarData} />
          </div>
        </div>
      </div>
    </>
  )
}
