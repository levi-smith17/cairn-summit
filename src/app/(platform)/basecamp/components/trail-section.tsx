'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Bookmark, NotebookPen, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { WaypointRow } from './waypoint-row'
import { InlineWaypointForm } from './inline-waypoint-form'
import { useTerminology } from '@/contexts/terminology-context'

interface TrailSectionProps {
  trail: { id: string; name: string }
  waypoints: any[]
  logCount: number
  tags: any[]
  folders: any[]
  totalWaypointCount: number
}

export function TrailSection({
  trail,
  waypoints,
  logCount,
  tags,
  folders,
  totalWaypointCount,
}: TrailSectionProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const [currentWaypoints, setCurrentWaypoints] = useState(waypoints)
  const [addingWaypoint, setAddingWaypoint] = useState(false)

  useEffect(() => { setCurrentWaypoints(waypoints) }, [waypoints])

  return (
    <div>
      {/* Trail group header */}
      <div className="lg:sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b flex items-center gap-1">
        {/* Trail name */}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate mx-1">
          {trail.name}
        </span>
        
        {/* Left: count buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 px-1 gap-0.5 text-xs font-normal text-muted-foreground shrink-0"
              onClick={() => router.push(`/waypoints?trailId=${trail.id}`)}
            >
              <Bookmark className="h-3 w-3" />
              {totalWaypointCount}
            </Button>
          </TooltipTrigger>
          <TooltipContent>View {terms.waypoints.toLowerCase()} for this {terms.trails.slice(0, -1).toLowerCase()}</TooltipContent>
        </Tooltip>

        {logCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 px-1 gap-0.5 text-xs font-normal text-muted-foreground shrink-0"
                onClick={() => router.push(`/logs?trailId=${trail.id}`)}
              >
                <NotebookPen className="h-3 w-3" />
                {logCount}
              </Button>
            </TooltipTrigger>
            <TooltipContent>View {terms.logs.toLowerCase()} for this {terms.trails.slice(0, -1).toLowerCase()}</TooltipContent>
          </Tooltip>
        )}

        {/* Right: action buttons */}
        <div className="ml-auto flex items-center gap-1">
          {logCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => router.push(`/logs?logbook=${trail.id}`)}
                >
                  <BookOpen className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open {terms.logbook.toLowerCase()}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setAddingWaypoint(v => !v)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add {terms.waypoints.slice(0, -1).toLowerCase()}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Inline add waypoint form */}
      {addingWaypoint && (
        <InlineWaypointForm
          defaultFolderId={trail.id}
          folders={folders}
          tags={tags}
          onCancel={() => setAddingWaypoint(false)}
          onSaved={() => setAddingWaypoint(false)}
        />
      )}

      {/* Waypoints */}
      <div className="flex flex-col divide-y">
        {currentWaypoints.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-3 text-center">
            No {terms.waypoints.toLowerCase()} in this {terms.trails.slice(0, -1).toLowerCase()}.
          </p>
        ) : (
          currentWaypoints.map(waypoint => (
            <WaypointRow
              key={waypoint.id}
              waypoint={waypoint}
              folders={folders}
              tags={tags}
            />
          ))
        )}
      </div>

    </div>
  )
}
