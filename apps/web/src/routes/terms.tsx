import { useAuth } from "@/hooks/use-auth"
import { PublicHeader } from '@/components/nav/public/public-header'
import { FooterNav } from '@/components/nav/footer'

export const metadata = {
    title: 'Terms of Service — Cairn',
    description: 'Terms of Service for Cairn.',
}

export default function Terms() {
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

            <div className="max-w-3xl mx-auto w-full px-6 py-12">
                <div className="bg-card border rounded-xl px-10 py-10">
                <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
                    <h1>Terms of Service</h1>
                    <p className="text-muted-foreground">Effective Date: March 11, 2026</p>

                    <h2>1. Agreement to Terms</h2>
                    <p>
                        By accessing or using Cairn ("the Service"), you agree to be bound by these Terms of Service.
                        If you do not agree, do not use the Service. The Service is operated by Levi Smith ("we," "us," or "our").
                    </p>

                    <h2>2. Eligibility</h2>
                    <p>
                        You must be at least 13 years old to use the Service. By using the Service, you represent that you meet this requirement.
                    </p>

                    <h2>3. Your Account</h2>
                    <p>
                        You are responsible for maintaining the confidentiality of your account and for all activity that occurs under it.
                        Notify us immediately at{' '}
                        <a href="mailto:contact@cairn.ing">contact@cairn.ing</a>{' '}
                        if you suspect unauthorized access.
                    </p>

                    <h2>4. User Content</h2>
                    <p>
                        You may upload photos, journal entries, and other content to the Service. You retain ownership of your content.
                        By uploading it, you grant us a limited license to store and display it solely for the purpose of operating the Service.
                        You are responsible for ensuring your content does not violate any laws or third-party rights.
                    </p>

                    <h2>5. Prohibited Activities</h2>
                    <p>You agree not to:</p>
                    <ul>
                        <li>Use the Service to advertise or offer to sell goods or services</li>
                        <li>Sell or transfer your account to another person</li>
                        <li>Upload content that is unlawful, harmful, or infringes on another's rights</li>
                        <li>Attempt to interfere with, reverse engineer, or disrupt the Service</li>
                        <li>Use the Service in any way that violates applicable laws or regulations</li>
                    </ul>

                    <h2>6. Third-Party Links</h2>
                    <p>
                        The Service may contain links to third-party websites. We are not responsible for the content or practices
                        of those sites and encourage you to review their terms and privacy policies.
                    </p>

                    <h2>7. Copyright</h2>
                    <p>
                        If you believe content on the Service infringes your copyright, please contact us at{' '}
                        <a href="mailto:privacy@cairn.ing">privacy@cairn.ing</a>{' '}
                        with a description of the work, the location of the infringing material, and your contact information.
                        We will respond to valid notices in accordance with applicable law.
                    </p>

                    <h2>8. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "as is" and "as available" without warranties of any kind, express or implied.
                        We do not guarantee the Service will be uninterrupted, error-free, or free of harmful components.
                    </p>

                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, our liability for any claim arising out of your use of the Service
                        is limited to the amount you paid us in the twelve months preceding the claim. Since the Service is currently
                        free, this limit is $0.00. We are not liable for any indirect, incidental, special, or consequential damages.
                    </p>

                    <h2>10. Dispute Resolution</h2>
                    <p>
                        <strong>Informal Negotiations.</strong> Before initiating arbitration, you agree to first attempt to resolve
                        any dispute informally by contacting us at{' '}
                        <a href="mailto:contact@cairn.ing">contact@cairn.ing</a>.
                        The parties will negotiate in good faith for at least 30 days.
                    </p>
                    <p>
                        <strong>Arbitration.</strong> If informal negotiations fail, disputes will be resolved by binding arbitration
                        in Ohio, United States, under rules of a mutually agreed arbitration body. We will cover arbitration fees if
                        deemed excessive. This agreement does not prevent either party from seeking injunctive relief in court for
                        intellectual property violations.
                    </p>
                    <p>
                        <strong>Litigation.</strong> If a dispute proceeds in court rather than arbitration, it will take place in
                        Ohio, United States.
                    </p>

                    <h2>11. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of the State of Ohio, United States, without regard to conflict of
                        law principles.
                    </p>

                    <h2>12. Updates to These Terms</h2>
                    <p>
                        We may update these Terms from time to time. When we make material changes, we will notify you by email
                        from{' '}
                        <a href="mailto:privacy@cairn.ing">privacy@cairn.ing</a>.
                        Continued use of the Service after the effective date of the updated Terms constitutes your acceptance.
                    </p>

                    <h2>13. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your access to the Service at our discretion, with or without
                        notice, for conduct that violates these Terms or is harmful to other users or the Service.
                    </p>

                    <h2>14. Contact</h2>
                    <p>
                        For questions about these Terms, contact us at:{' '}
                        <a href="mailto:contact@cairn.ing">contact@cairn.ing</a>
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
