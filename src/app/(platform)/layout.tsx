import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PlatformSidebar } from '@/components/nav/platform/platform-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TerminologyProvider } from '@/contexts/terminology-context'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user

  const wayfarer = await prisma.wayfarer.findUnique({
    where: { id: user.id! },
    select: { username: true, isAdmin: true },
  })

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
        />
        <SidebarInset className="min-w-0 h-svh overflow-hidden">
          <div className="flex flex-col h-full min-w-0 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TerminologyProvider>
  )
}