import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AboutContent } from '../components/about-content'

interface AboutPageProps {
    params: Promise<{ username: string }>
}

export default async function AboutPage({ params }: AboutPageProps) {
    const { username } = await params

    const [wayfarer, session, wayfarerCount] = await Promise.all([
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
        prisma.wayfarer.count({ where: { listed: true, username: { not: null } } }),
    ])

    if (!wayfarer || !wayfarer.listed) notFound()

    const isLoggedIn = !!session?.user
    const showDirectoryLink = isLoggedIn || wayfarerCount > 1

    return (
        <AboutContent
            username={username}
            wayfarer={{
                name: wayfarer.name,
                email: wayfarer.email,
                image: wayfarer.image,
                defaultTerminology: wayfarer.defaultTerminology,
                defaultTheme: wayfarer.defaultTheme,
            }}
            origins={wayfarer.origins}
            companions={wayfarer.companions}
            showDirectoryLink={showDirectoryLink}
            currentUser={session?.user ? {
                name: session.user.name ?? null,
                email: session.user.email ?? null,
                avatar: session.user.image ?? null,
            } : null}
        />
    )
}

export async function generateMetadata({ params }: AboutPageProps) {
    const { username } = await params

    const wayfarer = await prisma.wayfarer.findUnique({
        where: { username },
        include: { origins: true },
    })

    if (!wayfarer) return {}

    return {
        title: `${wayfarer.name ?? wayfarer.username} — About`,
        description: wayfarer.origins?.bio ?? `About ${wayfarer.name}`,
    }
}