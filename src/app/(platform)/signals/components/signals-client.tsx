'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SearchInput } from '@/components/filters/search-input'
import { ToggleFilter } from '@/components/filters/toggle-filter'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { SourcePicker, type Source } from './source-picker'
import { EmailClient } from './email-client'
import { SignalsInbox } from './signals-inbox'
import type { CachedEmailSummary } from './email-detail'
import { syncEmails } from '@/actions/email'

interface SignalReply {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  createdAt: Date
}

interface Signal {
  id: string
  senderName: string
  senderEmail: string
  body: string
  read: boolean
  createdAt: Date
  replies: SignalReply[]
}

interface ImapAccountSummary {
  id: string
  label: string
  emailAddress: string
  isDefault: boolean
}

interface SignalSettings {
  messagesPerPage: number
  autoMarkRead: boolean
  autoRefreshInterval: number
  compactView: boolean
  showSnippets: boolean
}

interface SignalsClientProps {
  signals: Signal[]
  imapAccounts: ImapAccountSummary[]
  cachedEmails: CachedEmailSummary[]
  initialTab: string
  initialAccountId: string | null
  initialFolder: string
  initialEmailId: string | null
  initialSignalId: string | null
  initialCompose: string | null
  signalSettings: SignalSettings
}

export function SignalsClient({
  signals,
  imapAccounts,
  cachedEmails,
  initialTab,
  initialAccountId,
  initialFolder,
  initialEmailId,
  initialSignalId,
  initialCompose,
  signalSettings,
}: SignalsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  // ── Source state ───────────────────────────────────────────────────────────
  const tabParam    = searchParams.get('tab')
  const accountParam = searchParams.get('account')
  const folderParam  = searchParams.get('folder')

  const resolvedSource: Source = (() => {
    if (tabParam === 'signals') return { type: 'signals' }
    if (tabParam === 'email' && (accountParam ?? initialAccountId)) {
      return {
        type: 'email',
        accountId: accountParam ?? initialAccountId!,
        folder: folderParam ?? initialFolder,
      }
    }
    if (initialTab === 'email' && initialAccountId) {
      return { type: 'email', accountId: initialAccountId, folder: initialFolder }
    }
    return { type: 'signals' }
  })()

  // ── Filter state (client-side) ─────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [onlyUnread,  setOnlyUnread]  = useState(false)
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [compose, setCompose] = useState<'new' | null>(
    initialCompose === 'new' ? 'new' : null,
  )

  const isEmail   = resolvedSource.type === 'email'
  const isSignals = resolvedSource.type === 'signals'

  // Stable primitives for the polling effect
  const activeAccountId = resolvedSource.type === 'email' ? resolvedSource.accountId : null
  const activeFolder    = resolvedSource.type === 'email' ? resolvedSource.folder    : null

  // Auto-refresh on both tabs at the configured interval.
  // Signals tab: router.refresh() picks up new contact-form submissions.
  // Email tab: syncEmails pulls from IMAP first, then router.refresh() updates the list.
  useEffect(() => {
    const ms = signalSettings.autoRefreshInterval * 1_000
    if (ms === 0) return

    const id = setInterval(async () => {
      if (isEmail && activeAccountId && activeFolder) {
        await syncEmails(activeAccountId, activeFolder)
      }
      router.refresh()
    }, ms)

    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmail, activeAccountId, activeFolder, router, signalSettings.autoRefreshInterval])

  const hasActiveFilters = search !== '' || onlyUnread || onlyStarred

  // ── Source change → update URL ─────────────────────────────────────────────
  function setSource(source: Source) {
    const params = new URLSearchParams()
    if (source.type === 'signals') {
      params.set('tab', 'signals')
    } else {
      params.set('tab', 'email')
      params.set('account', source.accountId)
      params.set('folder', source.folder)
    }
    router.push(`/signals?${params.toString()}`, { scroll: false })
    // Reset filters on source change
    setSearch('')
    setOnlyUnread(false)
    setOnlyStarred(false)
    setCompose(null)
  }

  // ── Derived: filtered signals ─────────────────────────────────────────────
  const filteredSignals = signals.filter(s => {
    if (onlyUnread && s.read)   return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.senderName?.toLowerCase().includes(q) && !s.body?.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ── Derived: filtered emails ──────────────────────────────────────────────
  const filteredEmails = cachedEmails.filter(e => {
    if (onlyUnread  && e.isRead)    return false
    if (onlyStarred && !e.isStarred) return false
    if (search) {
      const q = search.toLowerCase()
      const inSubject = e.subject?.toLowerCase().includes(q)
      const inFrom    = e.fromAddress.toLowerCase().includes(q) || e.fromName?.toLowerCase().includes(q)
      const inSnippet = e.snippet?.toLowerCase().includes(q)
      if (!inSubject && !inFrom && !inSnippet) return false
    }
    return true
  })

  const unreadSignals = signals.filter(s => !s.read).length
  const singularSignal = terms.signals.endsWith('s')
    ? terms.signals.slice(0, -1)
    : terms.signals

  return (
    <>
    <PlatformHeader title={terms.signals} />
    <div className="flex flex-col flex-1 min-h-0 gap-4 p-4 overflow-hidden w-full">

      {/* ── Filter bar ── */}
      <div className="rounded-lg border border-border bg-card p-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">

          {/* Source picker */}
          <SourcePicker
            accounts={imapAccounts}
            value={resolvedSource}
            onChange={setSource}
            signalsLabel={terms.signals}
            unreadSignals={unreadSignals}
          />

          {/* Search */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`Search ${terms.signals.toLowerCase()}…`}
          />

          {/* Unread toggle */}
          <ToggleFilter
            active={onlyUnread}
            onToggle={() => setOnlyUnread(v => !v)}
            label="Unread"
            tooltip={`Show unread ${singularSignal.toLowerCase()}s only`}
          />

          {/* Starred toggle — email only */}
          {isEmail && (
            <ToggleFilter
              active={onlyStarred}
              onToggle={() => setOnlyStarred(v => !v)}
              label="Starred"
              icon={<Star className={`h-3.5 w-3.5 ${onlyStarred ? 'fill-current' : ''}`} />}
            />
          )}

          {/* Clear */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-sm"
              onClick={() => { setSearch(''); setOnlyUnread(false); setOnlyStarred(false) }}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}

          {/* Settings — far right */}
          <div className="flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => router.push('/settings?section=signals')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{terms.signals} Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isSignals ? (
          <SignalsInbox
            signals={filteredSignals}
            singularTerm={singularSignal}
            pluralTerm={terms.signals}
            messagesPerPage={signalSettings.messagesPerPage}
            autoMarkRead={signalSettings.autoMarkRead}
            initialSelectedId={initialSignalId}
          />
        ) : (
          <EmailClient
            accounts={imapAccounts}
            emails={filteredEmails}
            activeAccountId={resolvedSource.type === 'email' ? resolvedSource.accountId : null}
            activeFolder={resolvedSource.type === 'email' ? resolvedSource.folder : 'INBOX'}
            initialEmailId={initialEmailId}
            compose={compose}
            onComposeClose={() => setCompose(null)}
            onCompose={() => setCompose('new')}
            messageTerm={singularSignal}
            messagesPerPage={signalSettings.messagesPerPage}
            autoMarkRead={signalSettings.autoMarkRead}
            compactView={signalSettings.compactView}
            showSnippets={signalSettings.showSnippets}
          />
        )}
      </div>

    </div>
    </>
  )
}
