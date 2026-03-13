'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { WaypointRow } from './waypoint-row'
import { LogRow } from './log-row'
import { InlineWaypointForm } from './inline-waypoint-form'
import { InlineLogForm } from './inline-log-form'
import { useTerminology } from '@/contexts/terminology-context'

interface TrailSectionProps {
  trail: { id: string; name: string }
  waypoints: any[]
  folderLogs: any[]
  tags: any[]
  folders: any[]
  allWaypoints: any[]
  totalWaypointCount: number
}

export function TrailSection({
  trail,
  waypoints,
  folderLogs,
  tags,
  folders,
  allWaypoints,
  totalWaypointCount,
}: TrailSectionProps) {
  const { terms } = useTerminology()
  const [currentWaypoints, setCurrentWaypoints] = useState(waypoints)
  const [addingWaypoint, setAddingWaypoint] = useState(false)
  const [addingLog, setAddingLog] = useState(false)

  useEffect(() => { setCurrentWaypoints(waypoints) }, [waypoints])

  return (
    <div>
      {/* Trail group header */}
      <div className="lg:sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {trail.name}
          <span className="ml-1.5 font-normal normal-case">({totalWaypointCount})</span>
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => { setAddingLog(v => !v); setAddingWaypoint(false) }}
              >
                <FileText className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add {terms.logs.slice(0, -1).toLowerCase()}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => { setAddingWaypoint(v => !v); setAddingLog(false) }}
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

      {/* Inline add log form (trail-level) */}
      {addingLog && (
        <InlineLogForm
          defaultFolderId={trail.id}
          folders={folders}
          waypoints={allWaypoints}
          tags={tags}
          onCancel={() => setAddingLog(false)}
          onSaved={() => setAddingLog(false)}
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
              allWaypoints={allWaypoints}
            />
          ))
        )}
      </div>

      {/* Trail-level logs sub-group */}
      {folderLogs.length > 0 && (
        <div>
          <div className="px-4 py-1 bg-muted/40 border-t border-b">
            <span className="text-xs text-muted-foreground">
              {terms.trails.slice(0, -1)} {terms.logs.toLowerCase()}
            </span>
          </div>
          <div className="flex flex-col divide-y">
            {folderLogs.map(log => (
              <LogRow key={log.id} log={log} folders={folders} tags={tags} allWaypoints={allWaypoints} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
