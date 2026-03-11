import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { ManifestStickyHeader } from '../components/sticky-header'
import { ContactForm } from './contact-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ContactPageProps {
    params: Promise<{ username: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
    const { username } = await params

    const [wayfarer, session, wayfarerCount] = await Promise.all([
        prisma.wayfarer.findUnique({
            where: { username },
            select: { name: true, email: true, image: true, defaultTerminology: true, defaultTheme: true, listed: true },
        }),
        auth(),
        prisma.wayfarer.count({ where: { listed: true, username: { not: null } } }),
    ])

    if (!wayfarer || !wayfarer.listed) notFound()

    const initials = wayfarer.name
        ? wayfarer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : wayfarer.email?.[0].toUpperCase() ?? '?'

    const isLoggedIn = !!session?.user
    const showDirectoryLink = isLoggedIn || wayfarerCount > 1

    const currentUser = session?.user ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        avatar: session.user.image ?? null,
    } : null

    return (
        <div className="relative">
            <ManifestStickyHeader
                username={username}
                wayfarer={wayfarer}
                terminology={wayfarer.defaultTerminology}
                showAvatar={false}
                showDirectoryLink={showDirectoryLink}
                currentUser={currentUser}
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

                <ContactForm username={username} wayfarerName={wayfarer.name} />

                <div className="flex justify-center pt-4">
                    <p className="text-xs text-muted-foreground">
                        Built with{' '}
                        <a href="/" className="underline underline-offset-4 hover:text-foreground">
                            Cairn
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: ContactPageProps) {
    const { username } = await params
    const wayfarer = await prisma.wayfarer.findUnique({ where: { username }, select: { name: true } })
    return { title: `Contact ${wayfarer?.name ?? username}` }
}
