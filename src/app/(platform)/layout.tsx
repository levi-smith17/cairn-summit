import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PlatformSidebar } from '@/components/nav/platform/platform-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TerminologyProvider } from '@/contexts/terminology-context'
import { SignalNotifier } from '@/components/signal-notifier'
import { ImpersonationBanner } from '@/components/impersonation-banner'
import { getImpersonatedId } from '@/lib/impersonation'
import { CommandPalette } from '@/components/search/command-palette'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user
  const adminId = user.id!

  const impersonatedId = await getImpersonatedId()
  const displayId = impersonatedId ?? adminId

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [adminWayfarer, displayWayfarer, unreadSignals, todayStops, waypointSettings] = await Promise.all([
    impersonatedId
      ? prisma.wayfarer.findUnique({ where: { id: adminId }, select: { isAdmin: true } })
      : null,
    prisma.wayfarer.findUnique({
      where: { id: displayId },
      select: { username: true, name: true, email: true, isAdmin: true },
    }),
    prisma.signal.count({ where: { wayfarerId: displayId, read: false } }),
    prisma.stop.count({
      where: { wayfarerId: displayId, startDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.waypointSettings.findUnique({
      where: { wayfarerId: adminId },
      select: { openInNewTab: true },
    }),
  ])

  // If impersonating, use admin's isAdmin for sidebar Admin group visibility
  const isAdmin = impersonatedId
    ? (adminWayfarer?.isAdmin ?? false)
    : (displayWayfarer?.isAdmin ?? false)

  return (
    <TerminologyProvider>
      <SidebarProvider>
        <PlatformSidebar
          wayfarer={{
            username: displayWayfarer?.username ?? null,
            name:     impersonatedId ? (displayWayfarer?.name ?? null) : (user.name ?? null),
            email:    impersonatedId ? (displayWayfarer?.email ?? null) : (user.email ?? null),
            avatar:   impersonatedId ? null : (user.image ?? null),
            isAdmin,
          }}
          badges={{
            signals:   unreadSignals,
            itinerary: todayStops,
          }}
        />
        <SidebarInset className="min-w-0 h-svh overflow-hidden">
          {impersonatedId && displayWayfarer && (
            <ImpersonationBanner
              targetName={displayWayfarer.name ?? ''}
              targetEmail={displayWayfarer.email ?? ''}
            />
          )}
          <SignalNotifier />
          <CommandPalette openInNewTab={waypointSettings?.openInNewTab ?? true} />
          <div className="flex flex-col h-full min-w-0 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TerminologyProvider>
  )
}