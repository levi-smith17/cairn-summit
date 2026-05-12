import { useAuth } from '@/hooks/use-auth'
import { FooterNav } from "@/components/nav/footer"
import { PublicHeader } from "@/components/nav/public/public-header"
import { PrivacyContactForm } from './contact-form'

export const metadata = {
    title: 'Privacy Request — Cairn',
    description: 'Submit a privacy-related request to the Cairn team.',
}

export default function PrivacyContact() {
    const { user } = useAuth()
    const wayfarer = user ? {
        name: user.name ?? null,
        email: user.email,
        avatar: user.image ?? null
    } : null

    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 border-b">
                <img src="/cairn-lockup2.png" alt="Cairn Summit Lockup" height={50} width={160} />
                <PublicHeader wayfarer={wayfarer} />
            </header>
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="bg-card border rounded-xl px-10 py-10 max-w-2xl w-full flex flex-col gap-8">
                    <div>
                        <h1 className="text-2xl font-semibold">Privacy Request</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Use this form to submit a privacy-related request — data access, deletion, correction, or any other inquiry.
                            We'll respond within 30 days.
                        </p>
                    </div>

                    <PrivacyContactForm />

                    <div className="flex justify-center pt-4">
                        <p className="text-xs text-muted-foreground">
                            You can also reach us directly at{' '}
                            <a href="mailto:privacy@cairn.ing" className="underline underline-offset-4 hover:text-foreground">
                                privacy@cairn.ing
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <div className="pb-6 flex justify-center">
                <FooterNav showCairn={true} />
            </div>
        </div>
    )
}
