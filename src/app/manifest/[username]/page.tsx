import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ManifestContent } from './components/manifest-content'

interface ManifestPageProps {
    params: Promise<{ username: string }>
}

export default async function ManifestPage({ params }: ManifestPageProps) {
    const { username } = await params

    const [wayfarer, session, wayfarerCount] = await Promise.all([
        prisma.wayfarer.findUnique({
            where: { username },
            include: {
                origins: true,
                expeditions: { orderBy: { startDate: 'desc' } },
                training: { orderBy: { startDate: 'desc' } },
                gear: { orderBy: { name: 'asc' } },
                landmarks: { orderBy: { startDate: 'desc' } },
                summits: { orderBy: { date: 'desc' } },
                pathfinding: { orderBy: { startDate: 'desc' } },
            },
        }),
        auth(),
        prisma.wayfarer.count({ where: { listed: true, username: { not: null } } }),
    ])

    if (!wayfarer) notFound()

    const isLoggedIn = !!session?.user
    const showDirectoryLink = isLoggedIn || wayfarerCount > 1

    return (
        <ManifestContent
            username={username}
            wayfarer={{
                name: wayfarer.name,
                email: wayfarer.email,
                image: wayfarer.image,
                defaultTerminology: wayfarer.defaultTerminology,
                defaultTheme: wayfarer.defaultTheme,
            }}
            origins={wayfarer.origins}
            expeditions={wayfarer.expeditions}
            training={wayfarer.training}
            gear={wayfarer.gear}
            landmarks={wayfarer.landmarks}
            summits={wayfarer.summits}
            pathfinding={wayfarer.pathfinding}
            showDirectoryLink={showDirectoryLink}
            currentUser={session?.user ? {
                name: session.user.name ?? null,
                email: session.user.email ?? null,
                avatar: session.user.image ?? null,
            } : null}
        />
    )
}

export async function generateMetadata({ params }: ManifestPageProps) {
    const { username } = await params

    const wayfarer = await prisma.wayfarer.findUnique({
        where: { username },
        include: { origins: true },
    })

    if (!wayfarer) return {}

    return {
        title: `${wayfarer.name ?? wayfarer.username} — Manifest`,
        description: wayfarer.origins?.headline ?? `${wayfarer.name}'s manifest`,
    }
}