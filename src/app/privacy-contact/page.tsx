import { PrivacyContactForm } from './privacy-contact-form'

export const metadata = {
    title: 'Privacy Request — Cairn',
    description: 'Submit a privacy-related request to the Cairn team.',
}

export default function PrivacyContactPage() {
    return (
        <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-8">
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
    )
}
