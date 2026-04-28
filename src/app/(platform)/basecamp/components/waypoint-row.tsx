'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Plus, Trash2, ExternalLink, Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { deleteWaypoint, toggleWaypointRead, toggleWaypointReadLater } from '@/actions/waypoints'
import { InlineWaypointForm } from './inline-waypoint-form'
import { InlineLogForm } from './inline-log-form'
import { LogRow } from './log-row'
import { useTerminology } from '@/contexts/terminology-context'

interface WaypointRowProps {
  waypoint: any
  folders: any[]
  tags: any[]
}

export function WaypointRow({ waypoint, folders, tags }: WaypointRowProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const [editing, setEditing] = useState(false)
  const [addingLog, setAddingLog] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    await deleteWaypoint(waypoint.id)
    router.refresh()
  }

  async function handleToggleRead() {
    await toggleWaypointRead(waypoint.id, !waypoint.read)
    router.refresh()
  }

  async function handleToggleReadLater() {
    await toggleWaypointReadLater(waypoint.id, !waypoint.readLater)
    router.refresh()
  }

  if (editing) {
    return (
      <InlineWaypointForm
        waypoint={waypoint}
        folders={folders}
        tags={tags}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  }

  return (
    <div className={`flex flex-col ${waypoint.read ? 'opacity-60' : ''}`}>
      {/* Waypoint row */}
      <div className="flex items-start gap-3 px-4 py-3 group">
        {waypoint.favicon ? (
          <img
            src={waypoint.favicon}
            alt=""
            className="h-4 w-4 rounded mt-0.5 shrink-0"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="h-4 w-4 rounded bg-muted-foreground/20 mt-0.5 shrink-0" />
        )}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight truncate">{waypoint.title}</p>
          <p className="text-xs text-muted-foreground truncate">{waypoint.url}</p>
          {waypoint.markers?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {waypoint.markers.map((t: any) => <MarkerBadge key={t.markerId} marker={t.marker} />)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={waypoint.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>Open</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setAddingLog(v => !v); setEditing(false) }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add {terms.logs.slice(0, -1).toLowerCase()}</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(true); setAddingLog(false) }}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleReadLater}>
                {waypoint.readLater
                  ? <><BookmarkCheck className="h-3.5 w-3.5 mr-2" />Remove from Read Later</>
                  : <><Bookmark className="h-3.5 w-3.5 mr-2" />Save for Later</>
                }
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleRead}>
                {waypoint.read
                  ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Mark as Unread</>
                  : <><Eye className="h-3.5 w-3.5 mr-2" />Mark as Read</>
                }
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline add log form */}
      {addingLog && (
        <div className="ml-7 mr-4 mb-2">
          <div className="border rounded-lg overflow-hidden">
            <InlineLogForm
              defaultWaypointId={waypoint.id}
              defaultFolderId={waypoint.trailId}
              folders={folders}
              waypoints={[]}
              tags={tags}
              onCancel={() => setAddingLog(false)}
              onSaved={() => setAddingLog(false)}
            />
          </div>
        </div>
      )}

      {/* Associated logs */}
      {waypoint.logs?.length > 0 && (
        <div className="flex flex-col divide-y border rounded-lg ml-7 mr-4 mb-2 overflow-hidden">
          {waypoint.logs.map((log: any) => (
            <LogRow key={log.id} log={log} folders={folders} tags={tags} />
          ))}
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {terms.waypoints.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{waypoint.title}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
