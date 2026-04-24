'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Bell, Bookmark, CalendarDays, ChevronLeft, Mail, Monitor, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { AccountForm } from './account-form'
import { AppearanceForm } from './appearance-form'
import { NotificationsForm } from './notifications-form'
import { PrivacyForm } from './privacy-form'
import { ItinerarySettingsForm } from './itinerary-settings-form'
import { SignalsForm } from './signals-form'
import { WaypointsSettingsForm } from './waypoints-settings-form'

type Section = 'account' | 'appearance' | 'notifications' | 'privacy' | 'itinerary' | 'signals' | 'waypoints'

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
  appearanceSettings: {
    sidebarDefault: 'EXPANDED' | 'COLLAPSED'
    defaultLandingPage: string
    dateFormat: 'MDY' | 'DMY' | 'YMD'
  }
  notificationSettings: {
    browserNotifications: boolean
    notificationSound: boolean
    emailDigest: 'NEVER' | 'DAILY' | 'WEEKLY'
  }
  privacySettings: {
    manifestVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
    contactFormEnabled: boolean
  }
  itinerarySettings: {
    defaultView: 'MONTH' | 'WEEK' | 'DAY'
    firstDayOfWeek: 'SUNDAY' | 'MONDAY'
    defaultEventDuration: number
    showWeekNumbers: boolean
  }
  waypointSettings: {
    defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
    openInNewTab: boolean
  }
}

const VALID_SECTIONS: Section[] = ['account', 'appearance', 'notifications', 'privacy', 'itinerary', 'signals', 'waypoints']

function isValidSection(s: string | null): s is Section {
  return VALID_SECTIONS.includes(s as Section)
}

export function SettingsClient({
  initialSection,
  account,
  calendars,
  subscriptions,
  imapAccounts,
  signalSettings,
  appearanceSettings,
  notificationSettings,
  privacySettings,
  itinerarySettings,
  waypointSettings,
}: SettingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  const sections: { value: Section; label: string; icon: React.ElementType; group: string }[] = [
    { value: 'account',       label: 'Account',       icon: User,         group: 'Profile' },
    { value: 'appearance',    label: 'Appearance',    icon: Monitor,      group: 'Profile' },
    { value: 'notifications', label: 'Notifications', icon: Bell,         group: 'Profile' },
    { value: 'privacy',       label: 'Privacy',       icon: Shield,       group: 'Profile' },
    { value: 'itinerary',     label: terms.itinerary, icon: CalendarDays, group: 'Platform' },
    { value: 'signals',       label: terms.signals,   icon: Mail,         group: 'Platform' },
    { value: 'waypoints',     label: terms.waypoints, icon: Bookmark,     group: 'Platform' },
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
      case 'account':       return <AccountForm defaultValues={account} isAdmin={account.isAdmin} />
      case 'appearance':    return <AppearanceForm defaultValues={{ ...appearanceSettings, timeFormat: account.timeFormat }} />
      case 'notifications': return <NotificationsForm defaultValues={notificationSettings} />
      case 'privacy':       return <PrivacyForm defaultValues={{ ...privacySettings, listed: account.listed }} />
      case 'itinerary':     return <ItinerarySettingsForm preferences={itinerarySettings} calendars={calendars} subscriptions={subscriptions} />
      case 'signals':       return <SignalsForm accounts={imapAccounts} defaultValues={signalSettings} />
      case 'waypoints':     return <WaypointsSettingsForm defaultValues={waypointSettings} />
    }
  }

  const groups = ['Profile', 'Platform']

  return (
    <>
      <PlatformHeader
        title="Settings"
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 md:hidden"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        }
      />
      <div className="flex flex-1 min-h-0 gap-4 p-4 overflow-hidden w-full">
      {/* Left — section nav */}
      <div className={`
        ${mobileShowNav ? 'flex' : 'hidden md:flex'}
        flex-col w-full md:w-52 shrink-0 rounded-lg border border-border bg-card overflow-hidden
      `}>
        <div className="px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium">Settings</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {groups.map(group => (
            <div key={group}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group}
              </p>
              {sections.filter(s => s.group === group).map(s => (
                <div
                  key={s.value}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 border-b border-border/30
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
    </>
  )
}
