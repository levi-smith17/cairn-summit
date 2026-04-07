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

  const [wayfarer, calendars, subscriptions, imapAccounts, signalSettings] = await Promise.all([
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
  ])

  return (
    <>
      <PlatformHeader title="Settings" />
      <div className="flex flex-1 min-h-0 p-4 overflow-hidden">
        <SettingsClient
          initialSection={section ?? 'account'}
          account={{
            username: wayfarer?.username ?? null,
            listed: wayfarer?.listed ?? true,
            defaultTerminology: wayfarer?.defaultTerminology ?? 'CAIRN',
            defaultTheme: wayfarer?.defaultTheme ?? 'SYSTEM',
            timeFormat: wayfarer?.timeFormat ?? 'TWELVE',
            customDomain: wayfarer?.customDomain ?? null,
            isAdmin: wayfarer?.isAdmin ?? false,
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
        />
      </div>
    </>
  )
}
