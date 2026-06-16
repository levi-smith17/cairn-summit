import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PlatformSidebar } from './platform-sidebar'
import { CommandPalette } from '@/components/search/command-palette'
import { SignalNotifier } from '@/components/signal-notifier'
import { useAuth } from '@/hooks/use-auth'
import { getProfile } from '@/lib/api/profile'
import { resolveProfileImage } from '@/lib/profile-image'

export default function PlatformLayout() {
    const { user } = useAuth()

    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: getProfile,
        enabled: !!user,
    })

    return (
        <SidebarProvider>
            <PlatformSidebar
                wayfarer={{
                    username: profile?.username ?? null,
                    name: profile?.name ?? user?.name ?? null,
                    email: profile?.email ?? user?.email ?? null,
                    avatar: resolveProfileImage(profile?.image ?? user?.image ?? null),
                    isAdmin: profile?.isAdmin ?? false,
                }}
                badges={{
                    itinerary: profile?.itinerary ?? 0,
                    signals: profile?.signals ?? 0,
                }}
            />
            <SidebarInset className="min-w-0 h-svh overflow-hidden">
                <SignalNotifier />
                <CommandPalette openInNewTab={true} />
                <div className="flex flex-col h-full min-w-0 overflow-y-auto">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
