'use client'

import { useState } from 'react'
import {
  Archive,
  Star,
  StarOff,
  FolderInput,
  Trash2,
  Mail,
  MailOpen,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { archiveEmail, starEmail, deleteEmail, moveEmail, markEmailRead, getMailboxes } from '@/actions/email'

const WELL_KNOWN_LABELS: Record<string, string> = {
  INBOX: 'Inbox',
  Sent: 'Sent',
  '[Gmail]/Sent Mail': 'Sent',
  Drafts: 'Drafts',
  '[Gmail]/Drafts': 'Drafts',
  Trash: 'Trash',
  '[Gmail]/Trash': 'Trash',
  Starred: 'Starred',
  '[Gmail]/Starred': 'Starred',
  Archive: 'Archive',
  '[Gmail]/All Mail': 'All Mail',
}

function folderLabel(name: string) {
  return WELL_KNOWN_LABELS[name] ?? name.split('/').pop() ?? name
}

interface EmailActionBarProps {
  emailId: string
  accountId: string
  /** The current mailbox — excluded from the move-to list */
  mailbox: string
  isStarred: boolean
  isRead: boolean
  singularTerm?: string
  /** 'sm' = h-6/w-6 buttons (list toolbar), 'md' = h-7/w-7 buttons (detail header) */
  size?: 'sm' | 'md'
  /** Pre-fetched folder list — skips the lazy fetch when provided */
  prefetchedFolders?: string[]
  onArchived: () => void
  onDeleted: () => void
  onStarToggled: (starred: boolean) => void
  onReadToggled: (read: boolean) => void
  onMoved: () => void
  /** Fires when the move popover opens/closes — lets a parent keep a wrapper visible */
  onMoveOpenChange?: (open: boolean) => void
}

export function EmailActionBar({
  emailId,
  accountId,
  mailbox,
  isStarred,
  isRead,
  singularTerm = 'Message',
  size = 'md',
  prefetchedFolders,
  onArchived,
  onDeleted,
  onStarToggled,
  onReadToggled,
  onMoved,
  onMoveOpenChange,
}: EmailActionBarProps) {
  const [removeOpen, setRemoveOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [folders, setFolders] = useState<string[]>(prefetchedFolders ?? [])
  const [foldersLoading, setFoldersLoading] = useState(false)

  const btn = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  function handleMoveOpenChange(open: boolean) {
    setMoveOpen(open)
    onMoveOpenChange?.(open)
    if (open && folders.length === 0) {
      setFoldersLoading(true)
      getMailboxes(accountId).then(result => {
        if (result.ok && result.mailboxes) setFolders(result.mailboxes)
        setFoldersLoading(false)
      })
    }
  }

  return (
    <>
      {/* Mark as read / unread */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={btn}
            onClick={e => {
              e.stopPropagation()
              onReadToggled(!isRead)
              markEmailRead(emailId, !isRead)
            }}
          >
            {isRead
              ? <Mail className={icon} />
              : <MailOpen className={icon} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isRead ? 'Mark as unread' : 'Mark as read'}</TooltipContent>
      </Tooltip>

      {/* Archive */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={btn}
            onClick={e => {
              e.stopPropagation()
              onArchived()
              archiveEmail(emailId)
            }}
          >
            <Archive className={icon} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Archive</TooltipContent>
      </Tooltip>

      {/* Star / Unstar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={btn}
            onClick={e => {
              e.stopPropagation()
              onStarToggled(!isStarred)
              starEmail(emailId, !isStarred)
            }}
          >
            {isStarred
              ? <StarOff className={`${icon} text-yellow-500`} />
              : <Star className={icon} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isStarred ? 'Unstar' : 'Star'}</TooltipContent>
      </Tooltip>

      {/* Move to folder */}
      <Popover open={moveOpen} onOpenChange={handleMoveOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={btn}
                onClick={e => e.stopPropagation()}
              >
                <FolderInput className={icon} />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Move to folder</TooltipContent>
        </Tooltip>
        <PopoverContent className="w-44 p-1" align="end" onClick={e => e.stopPropagation()}>
          {foldersLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : folders.filter(f => f !== mailbox).length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No other folders</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {folders.filter(f => f !== mailbox).map(f => (
                <button
                  key={f}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-muted transition-colors truncate block"
                  onClick={() => {
                    handleMoveOpenChange(false)
                    onMoved()
                    moveEmail(emailId, f)
                  }}
                >
                  {folderLabel(f)}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Remove */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`${btn} text-destructive hover:text-destructive`}
            onClick={e => { e.stopPropagation(); setRemoveOpen(true) }}
          >
            <Trash2 className={icon} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {singularTerm.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this {singularTerm.toLowerCase()}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setRemoveOpen(false)
                onDeleted()
                deleteEmail(emailId)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
