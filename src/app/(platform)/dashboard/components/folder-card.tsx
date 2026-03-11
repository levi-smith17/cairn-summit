'use client'

import { useState } from 'react'
import { Plus, Folder, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WaypointItem } from './waypoint-item'
import { LogItem } from './log-item'

const PAGE_SIZE = 5

interface FolderCardProps {
  folder: { id: string; name: string }
  waypoints: any[]
  folderLogs: any[]
  tags: any[]
  onAddWaypoint: (folderId: string) => void
  onEditWaypoint: (waypoint: any) => void
  onAddLog: (folderId: string, waypointId?: string) => void
  onEditLog: (log: any) => void
  totalWaypointCount: number
}

export function FolderCard({
  folder,
  waypoints,
  folderLogs,
  tags,
  totalWaypointCount,
  onAddWaypoint,
  onEditWaypoint,
  onAddLog,
  onEditLog,
}: FolderCardProps) {
  const [page, setPage] = useState(1)
  const [currentWaypoints, setCurrentWaypoints] = useState(waypoints)
  const [loadingPage, setLoadingPage] = useState(false)

  const [totalCount, setTotalCount] = useState(totalWaypointCount)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  async function goToPage(newPage: number) {
    setLoadingPage(true)
    try {
      const params = new URLSearchParams(window.location.search)
      params.set('folderId', folder.id)
      params.set('page', newPage.toString())
      params.set('pageSize', PAGE_SIZE.toString())
      const res = await fetch(`/api/dashboard/folder-waypoints?${params.toString()}`)
      const data = await res.json()
      setCurrentWaypoints(data.waypoints)
      setTotalCount(data.filteredCount)
      setPage(newPage)
    } finally {
      setLoadingPage(false)
    }
  }

  return (
    <div className="flex flex-col rounded-xl border bg-muted/30 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">{folder.name}</h2>
          <span className="text-xs text-muted-foreground">
            {totalWaypointCount} waypoint{totalWaypointCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7"
                onClick={() => onAddLog(folder.id)}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Note</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7"
                onClick={() => onAddWaypoint(folder.id)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Waypoint</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Waypoints */}
      <div className="flex flex-col divide-y">
        {loadingPage ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : currentWaypoints.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-6 text-center">
            No waypoints in this folder.
          </p>
        ) : (
          currentWaypoints.map(waypoint => (
            <WaypointItem
              key={waypoint.id}
              waypoint={waypoint}
              onEdit={onEditWaypoint}
              onAddLog={(waypointId) => onAddLog(folder.id, waypointId)}
              onEditLog={onEditLog}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || loadingPage}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {loadingPage ? '...' : `${page} / ${totalPages}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || loadingPage}
          >
            Next
          </Button>
        </div>
      )}

      {/* Folder notes */}
      {folderLogs.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-0 divide-y">
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Folder Notes
              </p>
            </div>
            {folderLogs.map(log => (
              <LogItem
                key={log.id}
                log={log}
                onEdit={onEditLog}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}