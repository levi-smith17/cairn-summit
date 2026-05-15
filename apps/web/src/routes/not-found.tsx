import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { FooterNav } from '@/components/nav/footer'
import { PublicHeader } from '@/components/nav/public/public-header'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

export default function NotFound() {
    const { user } = useAuth()
    const wayfarer = user ? {
        name: user.name ?? null,
        email: user.email ?? null,
        avatar: user.image ?? null,
    } : null

    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 border-b">
                <img src="/cairn-lockup.png" alt="Cairn Summit Lockup" height={50} width={160} />
                <PublicHeader wayfarer={wayfarer} />
            </header>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="bg-card border rounded-xl px-10 py-10 max-w-md w-full text-center flex flex-col items-center gap-4">
                    <div className="bg-muted rounded-full p-4">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">404</span>
                        <h1 className="text-2xl font-semibold">Trail Not Found</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            You've wandered off the marked path. This cairn doesn't exist — or it may have been moved further up the mountain.
                        </p>
                    </div>
                    <Button asChild className="mt-2">
                        <Link to="/">Return to the Outpost</Link>
                    </Button>
                </div>
            </div>

            <div className="pb-6 flex justify-center">
                <FooterNav showCairn={true} />
            </div>
        </div>
    )
}
