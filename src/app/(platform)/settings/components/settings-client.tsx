'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, User, CalendarDays, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTerminology } from '@/contexts/terminology-context'
import { AccountForm } from './account-form'
import { CalendarForm } from './calendar-form'
import { SignalsForm } from './signals-form'

type Section = 'account' | 'calendar' | 'signals'

export type CalendarEntry = {
  id: string
  name: string
  color: string
  appleId: string
}

export type SubscriptionEntry = {
  id: string
  name: string
  url: string
  color: string
}

export type ImapAccountEntry = {
  id: string
  label: string
  emailAddress: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  isDefault: boolean
}

interface SettingsClientProps {
  initialSection: string
  account: {
    username: string | null
    listed: boolean
    defaultTerminology: 'CAIRN' | 'STANDARD'
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
    timeFormat: 'TWELVE' | 'TWENTYFOUR'
    customDomain: string | null
    isAdmin: boolean
  }
  calendars: CalendarEntry[]
  subscriptions: SubscriptionEntry[]
  imapAccounts: ImapAccountEntry[]
  signalSettings: {
    messagesPerPage: number
    autoMarkRead: boolean
    autoRefreshInterval: number
    defaultView: 'SIGNALS' | 'EMAIL'
    compactView: boolean
    showSnippets: boolean
  }
}

function isValidSection(s: string | null): s is Section {
  return s === 'account' || s === 'calendar' || s === 'signals'
}

export function SettingsClient({ initialSection, account, calendars, subscriptions, imapAccounts, signalSettings }: SettingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  const sections: { value: Section; label: string; icon: React.ElementType }[] = [
    { value: 'account',  label: 'Account',      icon: User },
    { value: 'calendar', label: terms.itinerary, icon: CalendarDays },
    { value: 'signals',  label: terms.signals,   icon: Mail },
  ]

  const sectionParam = searchParams.get('section')
  const active: Section = isValidSection(sectionParam)
    ? sectionParam
    : isValidSection(initialSection)
      ? initialSection as Section
      : 'account'

  const mobileShowNav = sectionParam === null

  function setSection(s: Section) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', s)
    router.push(`/settings?${params.toString()}`, { scroll: false })
  }

  function clearSection() {
    router.push('/settings', { scroll: false })
  }

  function renderContent() {
    switch (active) {
      case 'account':  return <AccountForm defaultValues={account} isAdmin={account.isAdmin} />
      case 'calendar': return <CalendarForm calendars={calendars} subscriptions={subscriptions} />
      case 'signals':  return <SignalsForm accounts={imapAccounts} defaultValues={signalSettings} />
    }
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden w-full">
      {/* Left — section nav */}
      <div className={`
        ${mobileShowNav ? 'flex' : 'hidden md:flex'}
        flex-col w-full md:w-52 shrink-0 rounded-lg border border-border bg-card overflow-hidden
      `}>
        <div className="px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium">Settings</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sections.map(s => (
            <div
              key={s.value}
              className={`
                flex items-center gap-3 px-4 py-3 border-b border-border/50
                cursor-pointer transition-colors
                ${active === s.value ? 'bg-primary/20' : 'hover:bg-muted/50'}
              `}
              onClick={() => setSection(s.value)}
            >
              <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — section content */}
      <div className={`
        ${mobileShowNav ? 'hidden md:flex' : 'flex'}
        flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden
      `}>
        <div className="flex items-center gap-2 px-4 min-h-[48px] border-b border-border shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={clearSection}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {sections.find(s => s.value === active)?.label}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
