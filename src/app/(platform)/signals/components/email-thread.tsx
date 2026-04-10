'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, AlertCircle, Paperclip, Reply, Forward } from 'lucide-react'
import sanitizeHtml from 'sanitize-html'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmailCompose } from './email-compose'
import { EmailActionBar } from './email-action-bar'
import { fetchEmailBody } from '@/actions/email'
import { bodyCache } from './email-cache'
import type { CachedEmailSummary } from './email-detail'
import type { EmailThread } from './email-client'

interface EmailThreadProps {
  thread: EmailThread
  accountId: string
  fromAddress: string
  singularTerm?: string
  prefetchedFolders?: string[]
  onBack: () => void
  onMessagesRemoved: (ids: string[]) => void
  onStarToggled: (emailId: string, starred: boolean) => void
  onReadToggled: (emailId: string, read: boolean) => void
}

interface MessageCardProps {
  email: CachedEmailSummary
  accountId: string
  singularTerm: string
  prefetchedFolders?: string[]
  defaultExpanded: boolean
  onDeleted: () => void
  onStarToggled: (starred: boolean) => void
  onReadToggled: (read: boolean) => void
  onMoved: () => void
  onReply: () => void
  onForward: () => void
}

function sanitize(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'table', 'tbody', 'tr', 'td', 'th', 'thead']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style', 'class'],
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
  })
}

function MessageCard({
  email,
  accountId,
  singularTerm,
  prefetchedFolders,
  defaultExpanded,
  onDeleted,
  onStarToggled,
  onReadToggled,
  onMoved,
  onReply,
  onForward,
}: MessageCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [bodyHtml, setBodyHtml] = useState<string | null>(bodyCache.get(email.id)?.bodyHtml ?? null)
  const [bodyText, setBodyText] = useState<string | null>(bodyCache.get(email.id)?.bodyText ?? null)
  const [attachments, setAttachments] = useState(bodyCache.get(email.id)?.attachmentMeta ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!expanded) return
    if (bodyHtml !== null || bodyText !== null || loading) return
    setLoading(true)
    fetchEmailBody(email.id).then(result => {
      if (result.ok) {
        setBodyHtml(result.bodyHtml ?? null)
        setBodyText(result.bodyText ?? null)
        setAttachments(result.attachmentMeta ?? [])
        bodyCache.set(email.id, {
          bodyHtml: result.bodyHtml ?? null,
          bodyText: result.bodyText ?? null,
          attachmentMeta: result.attachmentMeta ?? [],
        })
      } else {
        setError(result.error ?? 'Failed to load')
      }
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  const sanitized = bodyHtml ? sanitize(bodyHtml) : null

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Card header — always visible */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm truncate ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
              {email.fromName || email.fromAddress}
            </span>
            {!email.isRead && <span className="h-2 w-2 rounded-full bg-header shrink-0" />}
            {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{email.snippet}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 ml-2">
          {email.date ? format(new Date(email.date), 'MMM d, h:mm a') : ''}
        </span>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <>
          {/* Action bar */}
          <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border bg-muted/30">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReply}>
                  <Reply className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onForward}>
                  <Forward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
            <div className="flex-1" />
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
              onMoved={onMoved}
              onStarToggled={onStarToggled}
              onReadToggled={onReadToggled}
            />
          </div>

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 border-t border-border">
              {attachments.map(a => (
                <div key={a.filename} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                  <Paperclip className="h-3 w-3" />
                  {a.filename}
                  <span className="text-muted-foreground">({Math.round(a.size / 1024)}KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="p-3 border-t border-border">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-destructive text-sm py-6 justify-center">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : sanitized ? (
              <div
                className="rounded overflow-x-auto bg-white text-black text-sm leading-normal [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline p-2"
                style={{ colorScheme: 'light' }}
                dangerouslySetInnerHTML={{ __html: sanitized }}
              />
            ) : bodyText ? (
              <pre className="text-sm whitespace-pre-wrap font-sans">{bodyText}</pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">(no content)</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function EmailThreadView({
  thread,
  accountId,
  fromAddress,
  singularTerm = 'Message',
  prefetchedFolders,
  onBack,
  onMessagesRemoved,
  onStarToggled,
  onReadToggled,
}: EmailThreadProps) {
  const [compose, setCompose] = useState<{ mode: 'reply' | 'forward'; email: CachedEmailSummary } | null>(null)
  const [localMessages, setLocalMessages] = useState(thread.messages)

  // Keep in sync if thread prop changes (server refresh)
  useEffect(() => { setLocalMessages(thread.messages) }, [thread.messages])

  const latestMessage = localMessages[localMessages.length - 1]

  function removeMessage(id: string) {
    setLocalMessages(prev => prev.filter(m => m.id !== id))
    onMessagesRemoved([id])
  }

  if (compose) {
    return (
      <EmailCompose
        accountId={accountId}
        fromAddress={fromAddress}
        mode={compose.mode}
        singularTerm={singularTerm}
        replyTo={compose.email.fromAddress}
        replySubject={compose.email.subject ?? ''}
        replyMessageId={compose.email.messageId}
        replyBodyHtml={bodyCache.get(compose.email.id)?.bodyHtml ?? null}
        onClose={() => setCompose(null)}
      />
    )
  }

  if (localMessages.length === 0) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold flex-1 min-w-0 truncate">
          {thread.normalizedSubject || '(no subject)'}
        </h2>
        <span className="text-xs text-muted-foreground shrink-0">
          {localMessages.length} {localMessages.length === 1 ? singularTerm.toLowerCase() : singularTerm.toLowerCase() + 's'}
        </span>
      </div>

      {/* Message cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {localMessages.map((msg, i) => (
          <MessageCard
            key={msg.id}
            email={msg}
            accountId={accountId}
            singularTerm={singularTerm}
            prefetchedFolders={prefetchedFolders}
            defaultExpanded={i === localMessages.length - 1}
            onDeleted={() => removeMessage(msg.id)}
            onMoved={() => removeMessage(msg.id)}
            onStarToggled={(starred) => onStarToggled(msg.id, starred)}
            onReadToggled={(read) => onReadToggled(msg.id, read)}
            onReply={() => setCompose({ mode: 'reply', email: msg })}
            onForward={() => setCompose({ mode: 'forward', email: msg })}
          />
        ))}
      </div>

      {/* Quick reply bar at the bottom */}
      {latestMessage && (
        <div className="border-t px-3 py-2 shrink-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCompose({ mode: 'reply', email: latestMessage })}
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setCompose({ mode: 'forward', email: latestMessage })}
          >
            <Forward className="h-3.5 w-3.5" />
            Forward
          </Button>
        </div>
      )}
    </div>
  )
}
