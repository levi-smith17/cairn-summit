import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { SettingsClient } from './components/settings-client'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { section } = await searchParams

  const [
    wayfarer,
    calendars,
    subscriptions,
    imapAccounts,
    signalSettings,
    appearanceSettings,
    notificationSettings,
    privacySettings,
    itinerarySettings,
    waypointSettings,
  ] = await Promise.all([
    prisma.wayfarer.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        listed: true,
        defaultTerminology: true,
        defaultTheme: true,
        timeFormat: true,
        customDomain: true,
        isAdmin: true,
      },
    }),
    prisma.iCloudCalendar.findMany({
      where: { wayfarerId: session.user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, color: true, appleId: true },
    }),
    prisma.calendarSubscription.findMany({
      where: { wayfarerId: session.user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, url: true, color: true },
    }),
    prisma.imapAccount.findMany({
      where: { wayfarerId: session.user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, label: true, emailAddress: true, imapHost: true, imapPort: true, imapSecure: true, smtpHost: true, smtpPort: true, smtpSecure: true, username: true, isDefault: true },
    }),
    prisma.signalSettings.findUnique({
      where: { wayfarerId: session.user.id },
      select: { messagesPerPage: true, autoMarkRead: true, autoRefreshInterval: true, defaultView: true, compactView: true, showSnippets: true },
    }),
    prisma.appearanceSettings.findUnique({
      where: { wayfarerId: session.user.id },
      select: { sidebarDefault: true, defaultLandingPage: true, dateFormat: true },
    }),
    prisma.notificationSettings.findUnique({
      where: { wayfarerId: session.user.id },
      select: { browserNotifications: true, notificationSound: true, emailDigest: true },
    }),
    prisma.privacySettings.findUnique({
      where: { wayfarerId: session.user.id },
      select: { manifestVisibility: true, contactFormEnabled: true },
    }),
    prisma.itinerarySettings.findUnique({
      where: { wayfarerId: session.user.id },
      select: { defaultView: true, firstDayOfWeek: true, defaultEventDuration: true, showWeekNumbers: true },
    }),
    prisma.waypointSettings.findUnique({
      where: { wayfarerId: session.user.id },
      select: { defaultSort: true, openInNewTab: true },
    }),
  ])

  return (
    <>
      <PlatformHeader title="Settings" />
      <div className="flex flex-1 min-h-0 p-4 overflow-hidden">
        <SettingsClient
          initialSection={section ?? 'account'}
          account={{
            username:           wayfarer?.username ?? null,
            listed:             wayfarer?.listed ?? true,
            defaultTerminology: wayfarer?.defaultTerminology ?? 'CAIRN',
            defaultTheme:       wayfarer?.defaultTheme ?? 'SYSTEM',
            timeFormat:         wayfarer?.timeFormat ?? 'TWELVE',
            customDomain:       wayfarer?.customDomain ?? null,
            isAdmin:            wayfarer?.isAdmin ?? false,
          }}
          calendars={calendars}
          subscriptions={subscriptions}
          imapAccounts={imapAccounts}
          signalSettings={{
            messagesPerPage:     signalSettings?.messagesPerPage     ?? 25,
            autoMarkRead:        signalSettings?.autoMarkRead        ?? true,
            autoRefreshInterval: signalSettings?.autoRefreshInterval ?? 30,
            defaultView:         signalSettings?.defaultView         ?? 'SIGNALS',
            compactView:         signalSettings?.compactView         ?? false,
            showSnippets:        signalSettings?.showSnippets        ?? true,
          }}
          appearanceSettings={{
            sidebarDefault:    appearanceSettings?.sidebarDefault    ?? 'EXPANDED',
            defaultLandingPage: appearanceSettings?.defaultLandingPage ?? '/basecamp',
            dateFormat:        appearanceSettings?.dateFormat        ?? 'MDY',
          }}
          notificationSettings={{
            browserNotifications: notificationSettings?.browserNotifications ?? false,
            notificationSound:    notificationSettings?.notificationSound    ?? true,
            emailDigest:          notificationSettings?.emailDigest          ?? 'NEVER',
          }}
          privacySettings={{
            manifestVisibility: privacySettings?.manifestVisibility ?? 'PUBLIC',
            contactFormEnabled: privacySettings?.contactFormEnabled ?? true,
          }}
          itinerarySettings={{
            defaultView:          itinerarySettings?.defaultView          ?? 'MONTH',
            firstDayOfWeek:       itinerarySettings?.firstDayOfWeek       ?? 'SUNDAY',
            defaultEventDuration: itinerarySettings?.defaultEventDuration ?? 60,
            showWeekNumbers:      itinerarySettings?.showWeekNumbers       ?? false,
          }}
          waypointSettings={{
            defaultSort:  waypointSettings?.defaultSort  ?? 'NEWEST',
            openInNewTab: waypointSettings?.openInNewTab ?? true,
          }}
        />
      </div>
    </>
  )
}
