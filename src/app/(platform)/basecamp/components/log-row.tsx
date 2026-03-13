'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import { RichTextContent } from '@/components/ui/rich-text-content'
import { deleteLog } from '@/actions/logs'
import { InlineLogForm } from './inline-log-form'
import { useTerminology } from '@/contexts/terminology-context'

interface LogRowProps {
  log: any
  folders: any[]
  tags: any[]
  allWaypoints: any[]
}

export function LogRow({ log, folders, tags, allWaypoints }: LogRowProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteLog(log.id)
    router.refresh()
  }

  if (editing) {
    return (
      <InlineLogForm
        log={log}
        folders={folders}
        waypoints={allWaypoints}
        tags={tags}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      <div
        className={`text-sm text-muted-foreground cursor-pointer ${!expanded ? 'line-clamp-2' : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <RichTextContent html={log.content} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {format(new Date(log.createdAt), 'MMM d, yyyy')}
          </span>
          {log.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {log.tags.map((t: any) => <MarkerBadge key={t.tagId} marker={t.tag} />)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(e => !e)}>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{expanded ? 'Collapse' : 'Expand'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive/80"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {terms.logs.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {terms.logs.slice(0, -1).toLowerCase()}? This cannot be undone.
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
