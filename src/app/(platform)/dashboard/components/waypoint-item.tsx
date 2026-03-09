'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { WaypointItemActions } from '@/app/(platform)/waypoints/components/waypoint-item-actions'
import { LogItem } from './log-item'

interface WaypointItemProps {
  waypoint: any
  onEdit: (waypoint: any) => void
  onAddLog: (waypointId: string) => void
  onEditLog: (log: any) => void
}

export function WaypointItem({
  waypoint,
  onEdit,
  onAddLog,
  onEditLog,
}: WaypointItemProps) {
  return (
    <div className={`flex flex-col gap-2 px-4 py-3 ${waypoint.read ? 'opacity-60' : ''}`}>
      {/* Waypoint row */}
      <div className="flex items-start gap-3">
        {waypoint.favicon && (
          <img
            src={waypoint.favicon}
            alt=""
            className="h-4 w-4 rounded mt-0.5 shrink-0"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight truncate">{waypoint.title}</p>
          <p className="text-xs text-muted-foreground truncate break-all">{waypoint.url}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddLog(waypoint.id)}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Note</TooltipContent>
          </Tooltip>
          <WaypointItemActions waypoint={waypoint} onEdit={onEdit} />
        </div>
      </div>

      {/* Tags */}
      {waypoint.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-7">
          {waypoint.tags.map((t: any) => (
            <TagBadge key={t.tagId} tag={t.tag} />
          ))}
        </div>
      )}

      {/* Associated logs */}
      {waypoint.logs.length > 0 && (
        <div className="flex flex-col divide-y border rounded-lg ml-7 overflow-hidden">
          {waypoint.logs.map((log: any) => (
            <LogItem
              key={log.id}
              log={log}
              onEdit={onEditLog}
            />
          ))}
        </div>
      )}
    </div>
  )
}