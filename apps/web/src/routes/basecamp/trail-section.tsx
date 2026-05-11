import { useState, useEffect } from 'react'
import { BookOpen, Bookmark, NotebookPen, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  onRefresh?: () => void
}

export function TrailSection({
  trail,
  waypoints,
  logCount,
  tags,
  folders,
  totalWaypointCount,
  onRefresh,
}: TrailSectionProps) {
  const navigate = useNavigate()
  const { terms } = useTerminology()
  const [currentWaypoints, setCurrentWaypoints] = useState(waypoints)
  const [addingWaypoint, setAddingWaypoint] = useState(false)

  useEffect(() => { setCurrentWaypoints(waypoints) }, [waypoints])

  return (
    <div>
      <div className="lg:sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate mx-1">
          {trail.name}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 px-1 gap-0.5 text-xs font-normal text-muted-foreground shrink-0"
              onClick={() => navigate(`/waypoints?trailId=${trail.id}`)}
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
                onClick={() => navigate(`/logs?trailId=${trail.id}`)}
              >
                <NotebookPen className="h-3 w-3" />
                {logCount}
              </Button>
            </TooltipTrigger>
            <TooltipContent>View {terms.logs.toLowerCase()} for this {terms.trails.slice(0, -1).toLowerCase()}</TooltipContent>
          </Tooltip>
        )}

        <div className="ml-auto flex items-center gap-1">
          {logCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => navigate(`/logs?logbook=${trail.id}`)}
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

      {addingWaypoint && (
        <InlineWaypointForm
          defaultFolderId={trail.id}
          folders={folders}
          tags={tags}
          onCancel={() => setAddingWaypoint(false)}
          onSaved={() => { setAddingWaypoint(false); onRefresh?.() }}
        />
      )}

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
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  )
}
