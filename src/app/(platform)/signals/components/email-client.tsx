'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Settings,
  Paperclip,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmailDetail, type CachedEmailSummary } from './email-detail'
import { EmailCompose } from './email-compose'
import { EmailActionBar } from './email-action-bar'
import { EmailThreadView } from './email-thread'
import { bodyCache, mailboxCache } from './email-cache'
import { markEmailRead, syncEmails, getMailboxes, fetchEmailBody, fetchConversation } from '@/actions/email'

// EmailThread interface — used by EmailThreadView in email-thread.tsx
export interface EmailThread {
  id: string
  normalizedSubject: string
  messages: CachedEmailSummary[]
  latestDate: Date | null
  unreadCount: number
  hasAttachments: boolean
  participants: string[]
}

// ── Component ────────────────────────────────────────────────────────────────

interface ImapAccountSummary {
  id: string
  label: string
  emailAddress: string
  isDefault: boolean
}

interface EmailClientProps {
  accounts: ImapAccountSummary[]
  emails: CachedEmailSummary[]
  activeAccountId: string | null
  activeFolder: string
  initialEmailId: string | null
  compose: 'new' | null
  onComposeClose: () => void
  onCompose: () => void
  messageTerm: string
  messagesPerPage: number
  autoMarkRead: boolean
  compactView: boolean
  showSnippets: boolean
}

export function EmailClient({
  accounts,
  emails,
  activeAccountId,
  activeFolder,
  initialEmailId,
  compose,
  onComposeClose,
  onCompose,
  messageTerm,
  messagesPerPage,
  autoMarkRead,
  compactView,
  showSnippets,
}: EmailClientProps) {
  const router = useRouter()
  const [localEmails, setLocalEmails] = useState<CachedEmailSummary[]>(emails)
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const selectedEmailIdRef = useRef<string | null>(null)
  const [conversation, setConversation] = useState<CachedEmailSummary[] | null>(null)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [syncing, startSync] = useTransition()
  const [page, setPage] = useState(1)
  const [openMoveId, setOpenMoveId] = useState<string | null>(null)
  const [folders, setFolders] = useState<string[]>(
    activeAccountId ? (mailboxCache.get(activeAccountId) ?? []) : []
  )

  // Keep ref in sync so async callbacks (Sent sync) can access latest selectedEmailId
  useEffect(() => { selectedEmailIdRef.current = selectedEmailId }, [selectedEmailId])

  // Seed selected email from initialEmailId
  useEffect(() => {
    if (initialEmailId) {
      loadConversation(initialEmailId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync localEmails when the server prop updates (after router.refresh())
  useEffect(() => { setLocalEmails(emails) }, [emails])

  // Pre-fetch folders and auto-sync Sent folder in background
  useEffect(() => {
    if (!activeAccountId) return

    async function init() {
      let folderList: string[]

      if (mailboxCache.has(activeAccountId!)) {
        folderList = mailboxCache.get(activeAccountId!)!
        setFolders(folderList)
      } else {
        const result = await getMailboxes(activeAccountId!)
        if (!result.ok || !result.mailboxes) return
        mailboxCache.set(activeAccountId!, result.mailboxes)
        setFolders(result.mailboxes)
        folderList = result.mailboxes
      }

      // Sync Sent folder so replies you've sent appear in conversation threads
      const sentNames = ['Sent', 'Sent Items', 'Sent Mail', '[Gmail]/Sent Mail', 'INBOX.Sent']
      const sentFolder = folderList.find(f =>
        sentNames.some(n => f.toLowerCase() === n.toLowerCase())
      )
      if (sentFolder && sentFolder !== activeFolder) {
        syncEmails(activeAccountId!, sentFolder).then(result => {
          if (result.ok && selectedEmailIdRef.current) {
            // Reload the open conversation to pick up any newly synced sent messages
            loadConversation(selectedEmailIdRef.current)
          }
        })
      }
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId])

  // Paginate emails
  const totalPages = Math.max(1, Math.ceil(localEmails.length / messagesPerPage))
  const clampedPage = Math.min(page, totalPages)
  const pageEmails = localEmails.slice((clampedPage - 1) * messagesPerPage, clampedPage * messagesPerPage)

  // Background prefetch bodies for visible page
  useEffect(() => {
    const unfetched = pageEmails.filter(e => !e.bodyFetched && !bodyCache.has(e.id))
    if (unfetched.length === 0) return
    let cancelled = false
    const run = async () => {
      const BATCH = 3
      for (let i = 0; i < unfetched.length; i += BATCH) {
        if (cancelled) break
        const batch = unfetched.slice(i, i + BATCH).filter(e => !bodyCache.has(e.id))
        await Promise.all(batch.map(async e => {
          const result = await fetchEmailBody(e.id)
          if (!cancelled && result.ok) {
            bodyCache.set(e.id, {
              bodyHtml: result.bodyHtml ?? null,
              bodyText: result.bodyText ?? null,
              attachmentMeta: result.attachmentMeta ?? [],
            })
          }
        }))
      }
    }
    const timer = setTimeout(run, 100)
    return () => { cancelled = true; clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage, activeAccountId, activeFolder])

  async function loadConversation(emailId: string) {
    setSelectedEmailId(emailId)

    // Optimistic: show the clicked email immediately from local state
    const optimistic = localEmails.find(e => e.id === emailId)
    if (optimistic) {
      setConversation([optimistic])
      setConversationLoading(false)
    } else {
      setConversation(null)
      setConversationLoading(true)
    }

    const result = await fetchConversation(emailId)
    if (result.ok && result.messages) {
      const msgs = result.messages as CachedEmailSummary[]
      setConversation(msgs)
      if (autoMarkRead) {
        const unread = msgs.filter(m => !m.isRead)
        for (const m of unread) markEmailRead(m.id, true)
        setLocalEmails(prev => prev.map(e =>
          unread.some(u => u.id === e.id) ? { ...e, isRead: true } : e
        ))
      }
    } else if (!optimistic) {
      // Fallback: show just the selected email if we had nothing to show optimistically
      const email = localEmails.find(e => e.id === emailId)
      if (email) setConversation([email])
    }
    setConversationLoading(false)
  }

  function handleSelectEmail(email: CachedEmailSummary) {
    // Optimistic mark-read for the clicked email
    if (autoMarkRead && !email.isRead) {
      setLocalEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e))
      markEmailRead(email.id, true)
    }
    loadConversation(email.id)
  }

  function handleSync() {
    if (!activeAccountId) return
    startSync(async () => {
      await syncEmails(activeAccountId, activeFolder)
      router.refresh()
    })
  }

  // Build active thread object for EmailThreadView from fetched conversation
  const activeThread: EmailThread | null = conversation && conversation.length > 0 ? {
    id: conversation[0].id,
    normalizedSubject: conversation[0].subject ?? '',
    messages: conversation,
    latestDate: conversation[conversation.length - 1]?.date ?? null,
    unreadCount: conversation.filter(m => !m.isRead).length,
    hasAttachments: conversation.some(m => m.hasAttachments),
    participants: [...new Set(conversation.map(m => m.fromName || m.fromAddress))],
  } : null

  const activeAccount = accounts.find(a => a.id === activeAccountId)
  const showDetail = compose === 'new' || selectedEmailId !== null
  const rowPadding = compactView ? 'py-2' : 'py-3'

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-24 text-muted-foreground rounded-lg border border-border bg-card">
        <Mail className="h-10 w-10" />
        <p className="font-medium">No email accounts</p>
        <p className="text-sm">Add an IMAP account in Settings to get started.</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/settings?section=signals')}>
          <Settings className="h-3.5 w-3.5" />
          Go to Settings
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden w-full">

      {/* ── Email list ── */}
      <div className={`${showDetail ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0 md:max-w-xs lg:max-w-sm xl:max-w-md rounded-lg border border-border bg-card overflow-hidden shrink-0`}>
        {/* List header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="text-sm font-medium">
            {localEmails.length > 0
              ? `${localEmails.length} ${messageTerm.toLowerCase()}${localEmails.length === 1 ? '' : 's'}`
              : `no ${messageTerm.toLowerCase()}s`}
          </span>
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSync} disabled={syncing || !activeAccountId}>
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sync</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCompose} disabled={!activeAccountId}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compose</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Email rows */}
        <div className="flex-1 overflow-y-auto">
          {localEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
              <Mail className="h-8 w-8 opacity-30" />
              <p>No {messageTerm.toLowerCase()}s</p>
            </div>
          ) : (
            pageEmails.map((email, i) => {
              const isSelected = selectedEmailId === email.id
              return (
                <div key={email.id} className="group relative">
                  <button
                    onClick={() => handleSelectEmail(email)}
                    className={`w-full text-left px-4 ${rowPadding} flex flex-col gap-1 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted' : ''}`}
                  >
                    {/* Sender row */}
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate flex-1 ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {email.fromName || email.fromAddress}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 group-hover:opacity-0 transition-opacity">
                        {email.isStarred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                        {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                        {!email.isRead && <span className="h-2 w-2 rounded-full bg-header shrink-0" />}
                      </div>
                    </div>
                    {/* Subject */}
                    <p className="text-xs font-medium truncate text-foreground/80">
                      {email.subject || '(no subject)'}
                    </p>
                    {/* Snippet / date */}
                    {showSnippets && (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                        {email.date && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(email.date), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                    )}
                    {!showSnippets && email.date && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(email.date), { addSuffix: false })}
                      </span>
                    )}
                  </button>

                  {/* Hover toolbar */}
                  <div className={`absolute right-2 top-1/4 -translate-y-1/2 flex items-center gap-0.5 bg-card border border-border rounded-md p-0.5 shadow-sm z-10 transition-opacity ${openMoveId === email.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <EmailActionBar
                      emailId={email.id}
                      accountId={activeAccountId ?? ''}
                      mailbox={activeFolder}
                      isStarred={email.isStarred}
                      isRead={email.isRead}
                      singularTerm={messageTerm}
                      size="sm"
                      prefetchedFolders={folders}
                      onArchived={() => {
                        setLocalEmails(prev => prev.filter(e => e.id !== email.id))
                        if (selectedEmailId === email.id) { setSelectedEmailId(null); setConversation(null) }
                      }}
                      onDeleted={() => {
                        setLocalEmails(prev => prev.filter(e => e.id !== email.id))
                        if (selectedEmailId === email.id) { setSelectedEmailId(null); setConversation(null) }
                      }}
                      onMoved={() => {
                        setLocalEmails(prev => prev.filter(e => e.id !== email.id))
                        if (selectedEmailId === email.id) { setSelectedEmailId(null); setConversation(null) }
                      }}
                      onStarToggled={(starred) => setLocalEmails(prev => prev.map(e => e.id === email.id ? { ...e, isStarred: starred } : e))}
                      onReadToggled={(read) => setLocalEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: read } : e))}
                      onMoveOpenChange={(open) => setOpenMoveId(open ? email.id : null)}
                    />
                  </div>

                  {i < pageEmails.length - 1 && <Separator />}
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0">
            <span className="text-xs text-muted-foreground">
              {(clampedPage - 1) * messagesPerPage + 1}–{Math.min(clampedPage * messagesPerPage, localEmails.length)} of {localEmails.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={clampedPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">{clampedPage} / {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={clampedPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail / Compose panel ── */}
      <div className={`${showDetail ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0 rounded-lg border border-border bg-card overflow-hidden`}>
        {compose === 'new' && activeAccount ? (
          <EmailCompose
            accountId={activeAccount.id}
            fromAddress={activeAccount.emailAddress}
            mode="new"
            singularTerm={messageTerm}
            onClose={onComposeClose}
          />
        ) : conversationLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading conversation…</p>
          </div>
        ) : activeThread && activeAccount ? (
          activeThread.messages.length === 1 ? (
            <EmailDetail
              key={activeThread.messages[0].id}
              email={activeThread.messages[0]}
              accountId={activeAccount.id}
              fromAddress={activeAccount.emailAddress}
              singularTerm={messageTerm}
              initialBody={bodyCache.get(activeThread.messages[0].id)}
              prefetchedFolders={folders}
              onBack={() => { setSelectedEmailId(null); setConversation(null) }}
              onDeleted={() => {
                setLocalEmails(prev => prev.filter(e => e.id !== activeThread.messages[0].id))
                setSelectedEmailId(null)
                setConversation(null)
              }}
              onStarToggled={(starred) => setLocalEmails(prev => prev.map(e => e.id === activeThread.messages[0].id ? { ...e, isStarred: starred } : e))}
              onReadToggled={(read) => setLocalEmails(prev => prev.map(e => e.id === activeThread.messages[0].id ? { ...e, isRead: read } : e))}
            />
          ) : (
            <EmailThreadView
              key={activeThread.id}
              thread={activeThread}
              accountId={activeAccount.id}
              fromAddress={activeAccount.emailAddress}
              singularTerm={messageTerm}
              prefetchedFolders={folders}
              onBack={() => { setSelectedEmailId(null); setConversation(null) }}
              onMessagesRemoved={(ids) => {
                setLocalEmails(prev => prev.filter(e => !ids.includes(e.id)))
                setConversation(prev => prev ? prev.filter(m => !ids.includes(m.id)) : null)
                if (activeThread.messages.every(m => ids.includes(m.id))) {
                  setSelectedEmailId(null)
                  setConversation(null)
                }
              }}
              onStarToggled={(id, starred) => setLocalEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: starred } : e))}
              onReadToggled={(id, read) => setLocalEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: read } : e))}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground text-sm">
            <Mail className="h-8 w-8 opacity-30" />
            <p>Select a message to read</p>
          </div>
        )}
      </div>

    </div>
  )
}
