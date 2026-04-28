import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ManifestContent } from './components/manifest-content'

export const revalidate = 300

interface ManifestPageProps {
    params: Promise<{ username: string }>
}

export default async function ManifestPage({ params }: ManifestPageProps) {
    const { username } = await params

    const [wayfarer, session] = await Promise.all([
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
            }
        }),
        auth(),
    ])

    if (!wayfarer) notFound()

    return (
        <ManifestContent
            wayfarer={{
                username: username,
                name: wayfarer.name,
                email: wayfarer.email,
                avatar: wayfarer.image,
                defaultTerminology: wayfarer.defaultTerminology,
                defaultTheme: wayfarer.defaultTheme,
            }}
            currentWayfarer={session?.user ? {
                name: session.user.name ?? null,
                email: session.user.email ?? null,
                avatar: session.user.image ?? null,
            } : null}
            origins={wayfarer.origins}
            expeditions={wayfarer.expeditions}
            training={wayfarer.training}
            gear={wayfarer.gear}
            landmarks={wayfarer.landmarks}
            summits={wayfarer.summits}
            pathfinding={wayfarer.pathfinding}
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