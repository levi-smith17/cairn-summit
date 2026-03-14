import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { ManifestHeader } from '../components/manifest-header'
import { ContactContent } from './contact-content'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ManifestFooter } from '../components/manifest-footer'

interface ContactPageProps {
    params: Promise<{ username: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
    const { username } = await params

    const [wayfarer, session] = await Promise.all([
        prisma.wayfarer.findUnique({
            where: { username },
            select: { name: true, email: true, image: true, defaultTerminology: true, defaultTheme: true, listed: true },
        }),
        auth(),
    ])

    if (!wayfarer || !wayfarer.listed) notFound()

    const initials = wayfarer.name
        ? wayfarer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : wayfarer.email?.[0].toUpperCase() ?? '?'

    const selectedWayfarer = {
        username: username,
        name: wayfarer.name ?? null,
        email: wayfarer.email ?? null,
        avatar: wayfarer.image ?? null,
    }

    const currentWayfarer = session?.user ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        avatar: session.user.image ?? null,
    } : null

    return (
        <div className="relative">
            <ManifestHeader
                wayfarer={selectedWayfarer}
                terminology={wayfarer.defaultTerminology}
                showAvatar={false}
                currentWayfarer={currentWayfarer}
                backHref={`/manifest/${username}`}
            />

            <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-8">
                <div className="flex items-center gap-4 pt-8">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={wayfarer.image ?? undefined} />
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Contact {wayfarer.name ?? username}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Send a message — your email stays private.
                        </p>
                    </div>
                </div>

                <ContactContent username={username} wayfarerName={wayfarer.name} />

                <ManifestFooter />
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: ContactPageProps) {
    const { username } = await params
    const wayfarer = await prisma.wayfarer.findUnique({ where: { username }, select: { name: true } })
    return { title: `Contact ${wayfarer?.name ?? username}` }
}
