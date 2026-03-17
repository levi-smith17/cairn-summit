import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { JourneyContent } from './journey-content'

interface JourneyPageProps {
    params: Promise<{ username: string }>
}

export default async function JourneyPage({ params }: JourneyPageProps) {
    const { username } = await params

    const [wayfarer, session] = await Promise.all([
        prisma.wayfarer.findUnique({
            where: { username },
            include: {
                origins: true,
                companions: {
                    orderBy: { createdAt: 'asc' },
                    include: { media: { orderBy: { order: 'asc' } } },
                },
            },
        }),
        auth(),
    ])

    if (!wayfarer || !wayfarer.listed) notFound()

    return (
        <JourneyContent
            wayfarer={{
                username: username,
                name: wayfarer.name,
                email: wayfarer.email,
                avatar: wayfarer.image,
                defaultTerminology: wayfarer.defaultTerminology,
                defaultTheme: wayfarer.defaultTheme,
            }}
            origins={wayfarer.origins}
            companions={wayfarer.companions}
            currentWayfarer={session?.user ? {
                name: session.user.name ?? null,
                email: session.user.email ?? null,
                avatar: session.user.image ?? null,
            } : null}
        />
    )
}

export async function generateMetadata({ params }: JourneyPageProps) {
    const { username } = await params

    const wayfarer = await prisma.wayfarer.findUnique({
        where: { username },
        include: { origins: true },
    })

    if (!wayfarer) return {}

    return {
        title: `${wayfarer.name ?? wayfarer.username} — Journey`,
        description: wayfarer.origins?.bio ?? `${wayfarer.name}'s Journey`,
    }
}