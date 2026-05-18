import { FooterNav } from '@/components/nav/footer'
import { PublicHeader } from '@/components/nav/public/public-header'

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 border-b">
                <img src="/cairn-lockup.png" alt="Cairn Summit" height={50} width={160} />
                <PublicHeader wayfarer={null} />
            </header>
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="rounded-xl bg-muted/50 p-6 flex flex-col max-w-md w-full gap-4">
                    {children}
                </div>
            </div>
            <div className="pb-6 flex justify-center">
                <FooterNav />
            </div>
        </div>
    )
}
