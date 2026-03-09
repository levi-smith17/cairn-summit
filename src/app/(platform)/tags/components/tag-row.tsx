'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTag } from '@/actions/waypoints'
import { TagBadge } from '../../waypoints/components/tag-badge'
import { useRouter } from 'next/navigation'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TagRowProps {
  tag: {
    id: string
    name: string
    color: string
    icon: string | null
    _count: { waypoints: number }
  }
  onEdit: (tag: any) => void
}

export function TagRow({ tag, onEdit }: TagRowProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    await deleteTag(tag.id)
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <TagBadge tag={tag} />
        <span className="text-xs text-muted-foreground pl-0.5">
          {tag._count.waypoints} waypoint{tag._count.waypoints !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(tag)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Edit tag
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <AlertDialog>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={deleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{tag.name}"? All waypoints/logs associated with this tag will be unassigned. This cannot be undone.
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
        </Tooltip>
      </div>
    </div>
  )
}