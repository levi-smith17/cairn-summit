'use client'

import { useState } from 'react'
import { ExternalLink, Pencil, Trash2, Bookmark, BookCheck, BookMarked, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleWaypointRead, toggleWaypointReadLater, deleteWaypoint } from '@/actions/waypoints'
import { useTerminology } from '@/contexts/terminology-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WaypointItemActionsProps {
  waypoint: any
  onEdit: (waypoint: any) => void
}

export function WaypointItemActions({ waypoint, onEdit }: WaypointItemActionsProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteWaypoint(waypoint.id)
    router.refresh()
  }

  async function handleToggleReadLater() {
    await toggleWaypointReadLater(waypoint.id, !waypoint.readLater)
    router.refresh()
  }

  async function handleToggleRead() {
    await toggleWaypointRead(waypoint.id, !waypoint.read)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {/* Open link — always visible */}
      <a href={waypoint.url} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </a>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={handleToggleReadLater}>
            <Bookmark className={`h-3.5 w-3.5 mr-2 ${waypoint.readLater ? 'fill-current' : ''}`} />
            {waypoint.readLater ? 'Remove from Read Later' : 'Save for Later'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleRead}>
            {waypoint.read
              ? <BookCheck className="h-3.5 w-3.5 mr-2" />
              : <BookMarked className="h-3.5 w-3.5 mr-2" />}
            {waypoint.read ? 'Mark as Unread' : 'Mark as Read'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(waypoint)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                disabled={deleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Remove
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {terms.waypoints.slice(0, -1)}</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove "{waypoint.title}"? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}