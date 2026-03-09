'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Link, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { deleteLog } from '@/actions/logs'
import { format } from 'date-fns'

interface LogRowProps {
  log: any
  onEdit: (log: any) => void
}

export function LogRow({ log, onEdit }: LogRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteLog(log.id)
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {/* Content preview */}
      <div
        className={`text-sm text-muted-foreground cursor-pointer ${!expanded ? 'line-clamp-2' : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <RichTextContent html={log.content} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">
            {format(new Date(log.createdAt), 'MMM d, yyyy')}
          </span>

          {log.folder && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Folder className="h-3 w-3" />
              {log.folder.name}
            </div>
          )}

          {log.waypoint && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link className="h-3 w-3" />
              {log.waypoint.title}
            </div>
          )}

          {log.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {log.tags.map((t: any) => (
                <TagBadge key={t.tagId} tag={t.tag} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpanded(e => !e)}
              >
                {expanded
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{expanded ? 'Collapse' : 'Expand'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(log)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
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
                  <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this entry? This cannot be undone.
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
    </div>
  )
}