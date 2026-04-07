'use client'

import { useState, useTransition, useEffect } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Star,
  StarOff,
  Archive,
  Loader2,
  Paperclip,
  AlertCircle,
  FolderInput,
} from 'lucide-react'
import sanitizeHtml from 'sanitize-html'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EmailCompose } from './email-compose'
import { fetchEmailBody, deleteEmail, starEmail, archiveEmail, getMailboxes, moveEmail } from '@/actions/email'

export interface CachedEmailSummary {
  id: string
  uid: string
  messageId: string | null
  subject: string | null
  fromName: string | null
  fromAddress: string
  toAddresses: string[]
  date: Date | null
  snippet: string | null
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  bodyFetched: boolean
  mailbox: string
}

interface EmailDetailProps {
  email: CachedEmailSummary
  accountId: string
  fromAddress: string
  singularTerm?: string
  onBack: () => void
  onDeleted: () => void
  onStarToggled: (starred: boolean) => void
}

export function EmailDetail({
  email,
  accountId,
  fromAddress,
  singularTerm = 'Message',
  onBack,
  onDeleted,
  onStarToggled,
}: EmailDetailProps) {
  const [bodyHtml, setBodyHtml]     = useState<string | null>(null)
  const [bodyText, setBodyText]     = useState<string | null>(null)
  const [attachments, setAttachments] = useState<{ filename: string; contentType: string; size: number }[]>([])
  const [loadingBody, startBodyLoad] = useTransition()
  const [bodyError, setBodyError]   = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, startDelete]     = useTransition()
  const [starring, startStar]       = useTransition()
  const [archiving, startArchive]   = useTransition()
  const [composeMode, setComposeMode] = useState<'reply' | 'forward' | null>(null)
  const [moveOpen, setMoveOpen] = useState(false)
  const [mailboxes, setMailboxes] = useState<string[] | null>(null)
  const [loadingMailboxes, startMailboxLoad] = useTransition()
  const [moving, startMove] = useTransition()

  function loadBody() {
    if (bodyHtml !== null || loadingBody) return
    setBodyError(null)
    startBodyLoad(async () => {
      const result = await fetchEmailBody(email.id)
      if (result.ok) {
        setBodyHtml(result.bodyHtml ?? null)
        setBodyText(result.bodyText ?? null)
        setAttachments(result.attachmentMeta ?? [])
      } else {
        setBodyError(result.error ?? 'Failed to load')
      }
    })
  }

  // Auto-load body on mount
  useEffect(() => { loadBody() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sanitized = bodyHtml
    ? sanitizeHtml(bodyHtml, {
        // 'style' (the tag) is intentionally excluded — <style> blocks bleed global CSS into the page.
        // Inline style= attributes are kept via allowedAttributes and are safely scoped to their element.
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'table', 'tbody', 'tr', 'td', 'th', 'thead']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['style', 'class'],
          'a': ['href', 'target', 'rel'],
          'img': ['src', 'alt', 'width', 'height'],
        },
        allowedSchemes: ['http', 'https', 'mailto', 'data'],
      })
    : null

  if (composeMode) {
    return (
      <EmailCompose
        accountId={accountId}
        fromAddress={fromAddress}
        mode={composeMode}
        singularTerm={singularTerm}
        replyTo={email.fromAddress}
        replySubject={email.subject ?? ''}
        replyMessageId={email.messageId}
        replyBodyHtml={bodyHtml}
        onClose={() => setComposeMode(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setComposeMode('reply')}>
              <Reply className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setComposeMode('forward')}>
              <Forward className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Forward</TooltipContent>
        </Tooltip>
        <Popover open={moveOpen} onOpenChange={(open) => {
          setMoveOpen(open)
          if (open && mailboxes === null && !loadingMailboxes) {
            startMailboxLoad(async () => {
              const result = await getMailboxes(accountId)
              if (result.ok) setMailboxes(result.mailboxes ?? [])
            })
          }
        }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <FolderInput className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Move to folder</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-48 p-1" align="end">
            {loadingMailboxes ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : mailboxes && mailboxes.length > 0 ? (
              <div className="max-h-56 overflow-y-auto">
                {mailboxes
                  .filter(m => m !== email.mailbox)
                  .map(m => (
                    <button
                      key={m}
                      disabled={moving}
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors disabled:opacity-50"
                      onClick={() =>
                        startMove(async () => {
                          await moveEmail(email.id, m)
                          setMoveOpen(false)
                          onDeleted()
                        })
                      }
                    >
                      {m}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground px-3 py-2">No other folders</p>
            )}
          </PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={archiving}
              onClick={() =>
                startArchive(async () => {
                  await archiveEmail(email.id)
                  onDeleted()
                })
              }
            >
              <Archive className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={starring}
              onClick={() =>
                startStar(async () => {
                  await starEmail(email.id, !email.isStarred)
                  onStarToggled(!email.isStarred)
                })
              }
            >
              {email.isStarred
                ? <StarOff className="h-4 w-4 text-yellow-500" />
                : <Star className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{email.isStarred ? 'Unstar' : 'Star'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive/80"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove</TooltipContent>
        </Tooltip>
      </div>

      {/* Email meta */}
      <div className="px-4 py-3 border-b space-y-1 shrink-0">
        <h2 className="text-sm font-semibold leading-snug">{email.subject || '(no subject)'}</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{email.fromName || email.fromAddress}</span>
          {email.fromName && <span>&lt;{email.fromAddress}&gt;</span>}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>To: {email.toAddresses.slice(0, 3).join(', ')}{email.toAddresses.length > 3 ? ` +${email.toAddresses.length - 3}` : ''}</span>
          {email.date && <span>{format(new Date(email.date), 'MMM d, yyyy h:mm a')}</span>}
        </div>
        {email.hasAttachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachments.map(a => (
              <div
                key={a.filename}
                className="flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded-full"
              >
                <Paperclip className="h-3 w-3" />
                {a.filename}
                <span className="text-muted-foreground">({Math.round(a.size / 1024)}KB)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingBody ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : bodyError ? (
          <div className="flex items-center gap-2 text-destructive text-sm py-8 justify-center">
            <AlertCircle className="h-4 w-4" />
            {bodyError}
          </div>
        ) : sanitized ? (
          <div
            className="rounded-md overflow-x-auto bg-white text-black text-sm leading-normal [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline p-3"
            style={{ colorScheme: 'light' }}
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        ) : bodyText ? (
          <pre className="text-sm whitespace-pre-wrap font-sans">{bodyText}</pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">(no content)</p>
        )}
      </div>

      {/* Remove dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this email. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                startDelete(async () => {
                  await deleteEmail(email.id)
                  setDeleteOpen(false)
                  onDeleted()
                })
              }
            >
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
