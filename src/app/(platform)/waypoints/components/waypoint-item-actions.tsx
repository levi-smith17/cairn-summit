'use client'

import { useState } from 'react'
import { ExternalLink, Pencil, Trash2, Bookmark, BookCheck, BookMarked, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleWaypointRead, toggleWaypointReadLater, deleteWaypoint } from '@/actions/waypoints'
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
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteWaypoint(waypoint.id)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Open link — always visible */}
      <a href={waypoint.url} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </a>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={() => toggleWaypointReadLater(waypoint.id, !waypoint.readLater)}>
            <Bookmark className={`h-3.5 w-3.5 mr-2 ${waypoint.readLater ? 'fill-current' : ''}`} />
            {waypoint.readLater ? 'Remove from Read Later' : 'Save for Later'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleWaypointRead(waypoint.id, !waypoint.read)}>
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
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Waypoint</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{waypoint.title}"? This cannot be undone.
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}