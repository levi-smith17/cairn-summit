import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { PrivacyContactForm } from './contact-form'

export default function PrivacyContact() {
    return (
        <>
            <PlatformHeader title="Privacy Request" />
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex items-center justify-center px-4 py-12">
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
            </div>
        </>
    )
}
