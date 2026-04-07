import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ManifestSummary } from './components/manifest-summary'
import { ManifestSections } from './components/manifest-sections'
import { WayfarerOverview } from './components/wayfarer-overview'
import { PlatformHeader } from '@/components/nav/platform/platform-header'

export default async function ManifestPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const wayfarerId = session?.user?.id!
    const wayfarer = await prisma.wayfarer.findUnique({
        where: { id: wayfarerId },
        select: { username: true, isAdmin: true },
    })

    const [origins, expeditions, training, gear, landmarks, summits, pathfinding, companions] = await Promise.all([
        prisma.origins.findUnique({ where: { wayfarerId } }),
        prisma.expedition.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.training.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.gear.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
        prisma.landmark.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.summit.findMany({ where: { wayfarerId }, orderBy: { date: 'desc' } }),
        prisma.pathfinding.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.companion.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' }, include: { media: { orderBy: { order: 'asc' } } } })
    ])

    return (
        <>
            <PlatformHeader title="My Manifest" />
            <div className="flex flex-col flex-1 min-h-0 gap-4 p-4 overflow-hidden">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 shrink-0">
                    <WayfarerOverview
                        name={session.user.name ?? null}
                        email={session.user.email ?? null}
                        image={session.user.image ?? null}
                        headline={origins?.headline ?? null}
                        summary={origins?.summary ?? null}
                        location={origins?.location ?? null}
                        website={origins?.website ?? null}
                        linkedin={origins?.linkedin ?? null}
                        github={origins?.github ?? null}
                        username={wayfarer?.username ?? null}
                    />
                    <ManifestSummary
                        sections={[
                            { label: 'Expeditions', count: expeditions.length },
                            { label: 'Training', count: training.length },
                            { label: 'Gear', count: gear.length },
                            { label: 'Landmarks', count: landmarks.length },
                            { label: 'Summits', count: summits.length },
                            { label: 'Pathfinding', count: pathfinding.length },
                            { label: 'Companions', count: companions.length },
                        ]}
                        mostRecentExpedition={expeditions[0] ?? null}
                        mostRecentTraining={training[0] ?? null}
                        topGear={gear.slice(0, 3)}
                        totalYearsExperience={
                            expeditions.reduce((total, exp) => {
                                const start = new Date(exp.startDate)
                                const end = exp.current ? new Date() : exp.endDate ? new Date(exp.endDate) : new Date()
                                return total + (end.getFullYear() - start.getFullYear())
                            }, 0)
                        }
                    />
                </div>
                <ManifestSections
                    origins={origins}
                    expeditions={expeditions}
                    training={training}
                    gear={gear}
                    landmarks={landmarks}
                    summits={summits}
                    pathfinding={pathfinding}
                    companions={companions}
                    isAdmin={wayfarer?.isAdmin ?? false}
                />
            </div>
        </>
    )
}
