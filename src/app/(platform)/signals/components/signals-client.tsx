'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SearchInput } from '@/components/filters/search-input'
import { ToggleFilter } from '@/components/filters/toggle-filter'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { SignalsInbox } from './signals-inbox'

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

interface SignalSettings {
  messagesPerPage: number
  autoMarkRead: boolean
  autoRefreshInterval: number
  compactView: boolean
  showSnippets: boolean
}

interface SignalsClientProps {
  signals: Signal[]
  initialSignalId: string | null
  signalSettings: SignalSettings
}

export function SignalsClient({ signals, initialSignalId, signalSettings }: SignalsClientProps) {
  const router = useRouter()
  const { terms } = useTerminology()

  const [search, setSearch] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)

  const hasActiveFilters = search !== '' || onlyUnread

  useEffect(() => {
    const ms = signalSettings.autoRefreshInterval * 1_000
    if (ms === 0) return
    const id = setInterval(() => router.refresh(), ms)
    return () => clearInterval(id)
  }, [router, signalSettings.autoRefreshInterval])

  const filteredSignals = signals.filter(s => {
    if (onlyUnread && s.read) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.senderName?.toLowerCase().includes(q) && !s.body?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const singularTerm = terms.signals.endsWith('s') ? terms.signals.slice(0, -1) : terms.signals

  return (
    <>
      <PlatformHeader title={terms.signals} />
      <div className="flex flex-col flex-1 min-h-0 gap-4 p-4 overflow-hidden w-full">

        {/* Filter bar */}
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${terms.signals.toLowerCase()}…`}
            />
            <ToggleFilter
              active={onlyUnread}
              onToggle={() => setOnlyUnread(v => !v)}
              label="Unread"
              tooltip={`Show unread ${singularTerm.toLowerCase()}s only`}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-sm"
                onClick={() => { setSearch(''); setOnlyUnread(false) }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
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

        {/* Inbox */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <SignalsInbox
            signals={filteredSignals}
            singularTerm={singularTerm}
            pluralTerm={terms.signals}
            messagesPerPage={signalSettings.messagesPerPage}
            autoMarkRead={signalSettings.autoMarkRead}
            initialSelectedId={initialSignalId}
          />
        </div>

      </div>
    </>
  )
}
