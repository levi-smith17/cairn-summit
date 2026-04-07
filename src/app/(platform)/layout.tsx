import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PlatformSidebar } from '@/components/nav/platform/platform-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TerminologyProvider } from '@/contexts/terminology-context'
import { SignalNotifier } from '@/components/signal-notifier'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user
  const wayfarerId = user.id!

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [wayfarer, unreadSignals, unreadEmails, todayStops] = await Promise.all([
    prisma.wayfarer.findUnique({
      where: { id: wayfarerId },
      select: { username: true, isAdmin: true },
    }),
    prisma.signal.count({ where: { wayfarerId, read: false } }),
    prisma.cachedEmail.count({
      where: { account: { wayfarerId }, isRead: false, mailbox: 'INBOX' },
    }),
    prisma.stop.count({
      where: { wayfarerId, startDate: { gte: todayStart, lte: todayEnd } },
    }),
  ])

  return (
    <TerminologyProvider>
      <SidebarProvider>
        <PlatformSidebar
          wayfarer={{
            username: wayfarer?.username ?? null,
            name: user.name ?? null,
            email: user.email ?? null,
            avatar: user.image ?? null,
            isAdmin: wayfarer?.isAdmin ?? false,
          }}
          badges={{
            signals:   unreadSignals + unreadEmails,
            itinerary: todayStops,
          }}
        />
        <SidebarInset className="min-w-0 h-svh overflow-hidden">
          <SignalNotifier />
          <div className="flex flex-col h-full min-w-0 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TerminologyProvider>
  )
}