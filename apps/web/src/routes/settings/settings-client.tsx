import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bookmark, CalendarDays, KeyRound, Monitor, NotebookPen, Shield, User } from 'lucide-react'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { useTerminology } from '@/contexts/terminology-context'
import { cardHoverBorder, cn } from '@/lib/utils'
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

function SettingsRail({
  sections,
  groups,
  active,
  onSelect,
}: {
  sections: { value: Section; label: string; icon: React.ElementType; group: string }[]
  groups: string[]
  active: Section
  onSelect: (section: Section) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">Settings</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <div key={group} className="mb-2">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-1 px-2">
              {sections
                .filter((s) => s.group === group)
                .map((s) => {
                  const selected = active === s.value
                  return (
                    <li key={s.value}>
                      <button
                        type="button"
                        onClick={() => onSelect(s.value)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 text-left text-sm transition-colors',
                          cardHoverBorder,
                          selected
                            ? 'border-[oklch(0.45_0.1_127)] bg-primary/10 dark:border-header'
                            : '',
                        )}
                      >
                        <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium text-foreground">{s.label}</span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
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

  function setSection(s: Section) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', s)
    setSearchParams(params)
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

  const sectionPageLinks: Partial<Record<Section, { href: string; label: string }>> = {
    itinerary: { href: '/itinerary', label: terms.itinerary },
    logs: { href: '/logs', label: terms.logs },
  }

  const activeLink = sectionPageLinks[active]
  const activeSection = sections.find((s) => s.value === active)
  const groups = ['Profile', 'Platform']

  return (
    <StudioLayout
      railLabel="Settings"
      contextBar={
        <PlatformStudioContextBar
          aria-label="Settings header"
          title="Settings"
          subtitle={activeSection?.label}
        />
      }
      rail={
        <SettingsRail
          sections={sections}
          groups={groups}
          active={active}
          onSelect={setSection}
        />
      }
      canvas={
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {activeLink ? (
            <div className="flex shrink-0 items-center border-b border-border px-4 py-2">
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => navigate(activeLink.href)}
              >
                Open {activeLink.label}
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      }
    />
  )
}
