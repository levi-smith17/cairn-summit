'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { FilterBar } from '@/components/filters/filter-bar'
import { WaypointList } from './waypoint-list'
import { WaypointForm } from './waypoint-form'

interface WaypointsClientProps {
  waypoints: any[]
  folders: any[]
  tags: any[]
}

export function WaypointsClient({ waypoints, folders, tags }: WaypointsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()
  const selectedId = searchParams.get('id')

  const selectedWaypoint = waypoints.find(w => w.id === selectedId) ?? null
  const showRightPanel = selectedId !== null

  function selectWaypoint(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function showNew() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', 'new')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleSaved(id: string) {
    selectWaypoint(id)
  }

  return (
    <>
      <PlatformHeader title={terms.waypoints} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Filter bar */}
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

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Left — waypoint list */}
          <div
            className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <WaypointList
              waypoints={waypoints}
              selectedId={selectedId}
              onSelect={selectWaypoint}
              onNew={showNew}
            />
          </div>

          {/* Right — form */}
          <div
            className={`${showRightPanel ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            {selectedId ? (
              <WaypointForm
                key={selectedId}
                waypoint={selectedWaypoint}
                folders={folders}
                tags={tags}
                onBack={clearSelection}
                onSaved={handleSaved}
                onDeleted={clearSelection}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a {terms.waypoints.slice(0, -1).toLowerCase()} to edit, or{' '}
                  <button onClick={showNew} className="text-primary hover:underline">
                    add a new one
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
