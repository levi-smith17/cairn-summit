'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Star,
  StarOff,
  Archive,
  Mail,
  Settings,
  Paperclip,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmailDetail, type CachedEmailSummary } from './email-detail'
import { EmailCompose } from './email-compose'
import { markEmailRead, syncEmails, archiveEmail, starEmail } from '@/actions/email'

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
  const [selectedId, setSelectedId] = useState<string | null>(initialEmailId)
  const [localEmails, setLocalEmails] = useState<CachedEmailSummary[]>(emails)
  const [syncing, startSync] = useTransition()
  const [page, setPage] = useState(1)

  const activeAccount = accounts.find(a => a.id === activeAccountId)
  const selectedEmail = localEmails.find(e => e.id === selectedId)
    ?? emails.find(e => e.id === selectedId)

  // Paginate the filtered email list
  const totalPages = Math.max(1, Math.ceil(emails.length / messagesPerPage))
  const clampedPage = Math.min(page, totalPages)
  const pageEmails = emails.slice((clampedPage - 1) * messagesPerPage, clampedPage * messagesPerPage)

  function handleSelectEmail(email: CachedEmailSummary) {
    setSelectedId(email.id)
    if (autoMarkRead && !email.isRead) {
      markEmailRead(email.id, true)
      setLocalEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e))
    }
  }

  function handleDeleted() {
    setLocalEmails(prev => prev.filter(e => e.id !== selectedId))
    setSelectedId(null)
  }

  function handleStarToggled(id: string, starred: boolean) {
    setLocalEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: starred } : e))
  }

  function handleSync() {
    if (!activeAccountId) return
    startSync(async () => {
      await syncEmails(activeAccountId, activeFolder)
      router.refresh()
    })
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-24 text-muted-foreground rounded-lg border border-border bg-card">
        <Mail className="h-10 w-10" />
        <p className="font-medium">No email accounts</p>
        <p className="text-sm">Add an IMAP account in Settings to get started.</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push('/settings?section=signals')}
        >
          <Settings className="h-3.5 w-3.5" />
          Go to Settings
        </Button>
      </div>
    )
  }

  const showDetail = compose === 'new' || selectedId !== null
  const rowPadding = compactView ? 'py-2' : 'py-3'

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden w-full">

      {/* ── Email list ── */}
      <div className={`${showDetail ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0 md:max-w-xs lg:max-w-sm xl:max-w-md rounded-lg border border-border bg-card overflow-hidden shrink-0`}>
        {/* List header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="text-sm font-medium">
            {emails.length > 0
              ? `${emails.length} ${(emails.length === 1 ? messageTerm : messageTerm + 's').toLowerCase()}`
              : messageTerm.toLowerCase() + 's'}
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
          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
              <Mail className="h-8 w-8 opacity-30" />
              <p>No {messageTerm.toLowerCase()}s</p>
            </div>
          ) : (
            pageEmails.map((email, i) => {
              const isSelected = selectedId === email.id
              const localEmail = localEmails.find(e => e.id === email.id) ?? email
              return (
                <div key={email.id} className="group relative">
                  <button
                    onClick={() => handleSelectEmail(email)}
                    className={`w-full text-left px-4 ${rowPadding} flex flex-col gap-1 hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${!localEmail.isRead ? 'font-semibold' : 'font-medium'}`}>
                        {email.fromName || email.fromAddress}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 group-hover:opacity-0 transition-opacity">
                        {localEmail.isStarred   && <Star      className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                        {email.hasAttachments   && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                        {!localEmail.isRead     && <span className="h-2 w-2 rounded-full bg-header" />}
                      </div>
                    </div>
                    <p className="text-xs font-medium truncate text-foreground/80">
                      {email.subject || '(no subject)'}
                    </p>
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
                  {/* Quick action toolbar — visible on row hover */}
                  <div className="absolute right-2 top-1/4 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-md p-0.5 shadow-sm z-10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={e => {
                            e.stopPropagation()
                            setLocalEmails(prev => prev.filter(em => em.id !== email.id))
                            if (selectedId === email.id) setSelectedId(null)
                            archiveEmail(email.id)
                          }}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Archive</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={e => {
                            e.stopPropagation()
                            handleStarToggled(email.id, !localEmail.isStarred)
                            starEmail(email.id, !localEmail.isStarred)
                          }}
                        >
                          {localEmail.isStarred
                            ? <StarOff className="h-3 w-3 text-yellow-500" />
                            : <Star    className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{localEmail.isStarred ? 'Unstar' : 'Star'}</TooltipContent>
                    </Tooltip>
                  </div>
                  {i < pageEmails.length - 1 && <Separator />}
                </div>
              )
            })
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0">
            <span className="text-xs text-muted-foreground">
              {(clampedPage - 1) * messagesPerPage + 1}–{Math.min(clampedPage * messagesPerPage, emails.length)} of {emails.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={clampedPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">{clampedPage} / {totalPages}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={clampedPage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
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
        ) : selectedEmail && activeAccount ? (
          <EmailDetail
            key={selectedEmail.id}
            email={selectedEmail}
            accountId={activeAccount.id}
            fromAddress={activeAccount.emailAddress}
            singularTerm={messageTerm}
            onBack={() => setSelectedId(null)}
            onDeleted={handleDeleted}
            onStarToggled={(starred) => handleStarToggled(selectedEmail.id, starred)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground text-sm">
            <Mail className="h-8 w-8 opacity-30" />
            <p>Select a {messageTerm.toLowerCase()} to read</p>
          </div>
        )}
      </div>

    </div>
  )
}
