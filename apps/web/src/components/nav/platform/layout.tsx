import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PlatformSidebar } from './platform-sidebar'
import { CommandPalette } from '@/components/search/command-palette'
import { SignalNotifier } from '@/components/signal-notifier'
import { InspectorPinProvider } from '@/contexts/inspector-pin-context'
import { useAuth } from '@/hooks/use-auth'
import { getProfile } from '@/lib/api/profile'
import { resolveProfileImage } from '@/lib/profile-image'

export type PlatformLayoutMode = 'full' | 'public'

export default function PlatformLayout({
    mode = 'full',
}: {
    mode?: PlatformLayoutMode
}) {
    const { user } = useAuth()
    const isAuthenticated = Boolean(user)

    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: getProfile,
        enabled: isAuthenticated,
    })

    return (
        <SidebarProvider>
            <InspectorPinProvider>
                <PlatformSidebar
                    mode={mode}
                    wayfarer={
                        isAuthenticated
                            ? {
                                  username: profile?.username ?? null,
                                  name: profile?.name ?? user?.name ?? null,
                                  email: profile?.email ?? user?.email ?? null,
                                  avatar: resolveProfileImage(profile?.image ?? user?.image ?? null),
                                  isAdmin: profile?.isAdmin ?? false,
                              }
                            : null
                    }
                    badges={
                        isAuthenticated
                            ? {
                                  itinerary: profile?.itinerary ?? 0,
                                  signals: profile?.signals ?? 0,
                              }
                            : undefined
                    }
                />
                <SidebarInset className="min-w-0 h-svh overflow-hidden">
                    {isAuthenticated && mode === 'full' ? <SignalNotifier /> : null}
                    {isAuthenticated ? <CommandPalette openInNewTab={true} /> : null}
                    <div className="flex flex-col h-full min-w-0 overflow-hidden">
                        <Outlet />
                    </div>
                </SidebarInset>
            </InspectorPinProvider>
        </SidebarProvider>
    )
}
