'use client'

import { useState, useTransition, useEffect } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Reply,
  Forward,
  Loader2,
  Paperclip,
  AlertCircle,
} from 'lucide-react'
import sanitizeHtml from 'sanitize-html'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmailCompose } from './email-compose'
import { EmailActionBar } from './email-action-bar'
import { fetchEmailBody } from '@/actions/email'

export interface CachedEmailSummary {
  id: string
  uid: string
  messageId: string | null
  inReplyTo: string | null
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
  initialBody?: { bodyHtml: string | null; bodyText: string | null; attachmentMeta: { filename: string; contentType: string; size: number }[] }
  prefetchedFolders?: string[]
  onBack: () => void
  onDeleted: () => void
  onStarToggled: (starred: boolean) => void
  onReadToggled?: (read: boolean) => void
}

export function EmailDetail({
  email,
  accountId,
  fromAddress,
  singularTerm = 'Message',
  initialBody,
  prefetchedFolders,
  onBack,
  onDeleted,
  onStarToggled,
  onReadToggled,
}: EmailDetailProps) {
  const [bodyHtml, setBodyHtml]       = useState<string | null>(initialBody?.bodyHtml ?? null)
  const [bodyText, setBodyText]       = useState<string | null>(initialBody?.bodyText ?? null)
  const [attachments, setAttachments] = useState<{ filename: string; contentType: string; size: number }[]>(initialBody?.attachmentMeta ?? [])
  const [loadingBody, startBodyLoad]  = useTransition()
  const [bodyError, setBodyError]     = useState<string | null>(null)
  const [composeMode, setComposeMode] = useState<'reply' | 'forward' | null>(null)

  function loadBody() {
    if (bodyHtml !== null || bodyText !== null || loadingBody) return
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

  useEffect(() => { loadBody() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sanitized = bodyHtml
    ? sanitizeHtml(bodyHtml, {
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
        <EmailActionBar
          emailId={email.id}
          accountId={accountId}
          mailbox={email.mailbox}
          isStarred={email.isStarred}
          isRead={email.isRead}
          singularTerm={singularTerm}
          size="md"
          prefetchedFolders={prefetchedFolders}
          onArchived={onDeleted}
          onDeleted={onDeleted}
          onMoved={onDeleted}
          onStarToggled={onStarToggled}
          onReadToggled={(read) => onReadToggled?.(read)}
        />
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
    </div>
  )
}
