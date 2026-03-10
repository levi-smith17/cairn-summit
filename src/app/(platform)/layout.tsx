import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user

  return (
    <SidebarProvider>
      <AppSidebar wayfarer={{
        name: user.name ?? null,
        email: user.email ?? null,
        avatar: user.image ?? null,
      }} />
      <SidebarInset className="min-w-0 h-svh overflow-hidden">
        <div className="flex flex-col h-full min-w-0 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}