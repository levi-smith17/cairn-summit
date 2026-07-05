import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, CalendarDays, KeyRound, Monitor, NotebookPen, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { AccountForm } from './account-form'
import { AppearanceForm } from './appearance-form'
import { PrivacyForm } from './privacy-form'
import { ItinerarySettingsForm, type CalendarEntry, type SubscriptionEntry } from './itinerary-settings-form'
import { WaypointsSettingsForm } from './waypoints-settings-form'
import { LogSettingsForm } from './log-settings-form'
import { IntegrationsForm } from './integrations-form'

type Section = 'account' | 'appearance' | 'privacy' | 'itinerary' | 'waypoints' | 'logs' | 'integrations'

interface SettingsClientProps {
  initialSection: string
  account: {
    name: string | null
    image: string | null
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
  logSettings: {
    logsPerPage: number
    defaultSort: 'NEWEST' | 'OLDEST'
  }
  appearanceSettings: {
    sidebarDefault: 'EXPANDED' | 'COLLAPSED'
    defaultLandingPage: string
    dateFormat: 'MDY' | 'DMY' | 'YMD'
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
    waypointsPerPage: number
  }
  onRefresh: () => void
}

const VALID_SECTIONS: Section[] = ['account', 'appearance', 'privacy', 'integrations', 'itinerary', 'waypoints', 'logs']

function isValidSection(s: string | null): s is Section {
  return VALID_SECTIONS.includes(s as Section)
}

export function SettingsClient({
  initialSection,
  account,
  calendars,
  subscriptions,
  logSettings,
  appearanceSettings,
  privacySettings,
  itinerarySettings,
  waypointSettings,
  onRefresh,
}: SettingsClientProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { terms } = useTerminology()

  const sections: { value: Section; label: string; icon: React.ElementType; group: string }[] = [
    { value: 'account', label: 'Account', icon: User, group: 'Profile' },
    { value: 'appearance', label: 'Appearance', icon: Monitor, group: 'Profile' },
    { value: 'privacy', label: 'Privacy', icon: Shield, group: 'Profile' },
    { value: 'integrations', label: 'Integrations', icon: KeyRound, group: 'Profile' },
    { value: 'itinerary', label: terms.itinerary, icon: CalendarDays, group: 'Platform' },
    { value: 'logs', label: terms.logs, icon: NotebookPen, group: 'Platform' },
    { value: 'waypoints', label: terms.waypoints, icon: Bookmark, group: 'Platform' },
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
    setSearchParams(params)
  }

  function clearSection() {
    setSearchParams(new URLSearchParams())
  }

  function renderContent() {
    switch (active) {
      case 'account': return <AccountForm defaultValues={account} isAdmin={account.isAdmin} />
      case 'appearance': return <AppearanceForm defaultValues={{ ...appearanceSettings, timeFormat: account.timeFormat }} />
      case 'privacy': return <PrivacyForm defaultValues={{ ...privacySettings, listed: account.listed }} />
      case 'integrations': return <IntegrationsForm />
      case 'itinerary': return <ItinerarySettingsForm preferences={itinerarySettings} calendars={calendars} subscriptions={subscriptions} onRefresh={onRefresh} />
      case 'logs': return <LogSettingsForm defaultValues={logSettings} />
      case 'waypoints': return <WaypointsSettingsForm defaultValues={waypointSettings} />
    }
  }

  const sectionPageLinks: Partial<Record<Section, { href: string; label: string; icon: React.ElementType }>> = {
    itinerary: { href: '/itinerary', label: terms.itinerary, icon: CalendarDays },
    logs:    { href: '/logs',    label: terms.logs,    icon: NotebookPen },
    waypoints: { href: '/waypoints', label: terms.waypoints, icon: Bookmark },
  }

  const activeLink = sectionPageLinks[active]

  const groups = ['Profile', 'Platform']

  return (
    <>
      <PlatformHeader title="Settings" />
      <div className="flex flex-1 min-h-0 gap-4 p-4 overflow-hidden w-full">
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

        <div className={`
          ${mobileShowNav ? 'hidden md:flex' : 'flex'}
          flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden
        `}>
          <div className="grid grid-cols-3 items-center w-full gap-2 px-4 min-h-[48px] border-b border-border shrink-0">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs md:hidden justify-self-start" onClick={clearSection}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            {(() => {
              const sec = sections.find(s => s.value === active)
              return activeLink
                ? <>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-sm md:hidden" onClick={() => navigate(activeLink.href)}>
                    <activeLink.icon className="h-3.5 w-3.5" />
                    {activeLink.label}
                  </Button>
                  <span className="text-sm hidden md:inline">{sec?.label}</span>
                </>
                : <>
                  <span className="flex items-center gap-1.5 text-sm mx-auto md:hidden">
                    {sec && <sec.icon className="h-3.5 w-3.5" />}
                    {sec?.label}
                  </span>
                  <span className="text-sm hidden md:inline">{sec?.label}</span>
                </>
            })()}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  )
}
