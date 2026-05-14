import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { SettingsClient } from './settings/settings-client'
import { getSettings } from '@/lib/api/settings'

const DEFAULTS = {
  account: {
    name: null as string | null,
    image: null as string | null,
    username: null as string | null,
    listed: true,
    defaultTerminology: 'CAIRN' as const,
    defaultTheme: 'SYSTEM' as const,
    timeFormat: 'TWELVE' as const,
    customDomain: null as string | null,
    isAdmin: false,
  },
  calendars: [] as any[],
  subscriptions: [] as any[],
  signalSettings: {
    messagesPerPage: 25,
    autoMarkRead: true,
    autoRefreshInterval: 0,
    compactView: false,
    showSnippets: true,
  },
  logSettings: {
    logsPerPage: 25,
    defaultSort: 'NEWEST' as const,
  },
  appearanceSettings: {
    sidebarDefault: 'EXPANDED' as const,
    defaultLandingPage: '/basecamp',
    dateFormat: 'MDY' as const,
  },
  notificationSettings: {
    browserNotifications: false,
    notificationSound: true,
    emailDigest: 'NEVER' as const,
  },
  privacySettings: {
    manifestVisibility: 'PUBLIC' as const,
    contactFormEnabled: true,
  },
  itinerarySettings: {
    defaultView: 'MONTH' as const,
    firstDayOfWeek: 'SUNDAY' as const,
    defaultEventDuration: 60,
    showWeekNumbers: false,
  },
  waypointSettings: {
    defaultSort: 'NEWEST' as const,
    openInNewTab: true,
    waypointsPerPage: 25,
  },
}

export default function Settings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['settings'] })
  }

  return (
    <SettingsClient
      initialSection={searchParams.get('section') ?? 'account'}
      account={settings?.account ?? DEFAULTS.account}
      calendars={settings?.calendars ?? DEFAULTS.calendars}
      subscriptions={settings?.subscriptions ?? DEFAULTS.subscriptions}
      signalSettings={settings?.signalSettings ?? DEFAULTS.signalSettings}
      logSettings={settings?.logSettings ?? DEFAULTS.logSettings}
      appearanceSettings={settings?.appearanceSettings ?? DEFAULTS.appearanceSettings}
      notificationSettings={settings?.notificationSettings ?? DEFAULTS.notificationSettings}
      privacySettings={settings?.privacySettings ?? DEFAULTS.privacySettings}
      itinerarySettings={settings?.itinerarySettings ?? DEFAULTS.itinerarySettings}
      waypointSettings={settings?.waypointSettings ?? DEFAULTS.waypointSettings}
      onRefresh={onRefresh}
    />
  )
}
