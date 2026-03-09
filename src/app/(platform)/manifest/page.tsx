import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ManifestSummary } from './components/manifest-summary'
import { ManifestTabs } from './components/manifest-tabs'
import { WayfarerOverview } from './components/wayfarer-overview'
import { PageHeader } from '@/components/nav/page-header'

export default async function ManifestPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const wayfarerId = session?.user?.id!
    const wayfarer = await prisma.wayfarer.findUnique({
        where: { id: wayfarerId },
        select: { username: true, listed: true, defaultTerminology: true, defaultTheme: true },
    })

    const [origins, expeditions, training, gear, landmarks, summits, pathfinding] = await Promise.all([
        prisma.origins.findUnique({ where: { wayfarerId } }),
        prisma.expedition.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.training.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.gear.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
        prisma.landmark.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
        prisma.summit.findMany({ where: { wayfarerId }, orderBy: { date: 'desc' } }),
        prisma.pathfinding.findMany({ where: { wayfarerId }, orderBy: { startDate: 'desc' } }),
    ])

    return (
        <>
            <PageHeader title="Manifest" />
            <div className="flex flex-1 flex-col gap-4 p-4 min-w-0 overflow-hidden">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            { label: 'Origins', count: origins ? 1 : 0 },
                            { label: 'Expeditions', count: expeditions.length },
                            { label: 'Training', count: training.length },
                            { label: 'Gear', count: gear.length },
                            { label: 'Landmarks', count: landmarks.length },
                            { label: 'Summits', count: summits.length },
                            { label: 'Pathfinding', count: pathfinding.length },
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
                <div className="flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
                    <ManifestTabs
                        origins={origins}
                        expeditions={expeditions}
                        training={training}
                        gear={gear}
                        landmarks={landmarks}
                        summits={summits}
                        pathfinding={pathfinding}
                        settings={{
                            username: wayfarer?.username ?? null,
                            listed: wayfarer?.listed ?? true,
                            defaultTerminology: wayfarer?.defaultTerminology ?? 'CAIRN',
                            defaultTheme: wayfarer?.defaultTheme ?? 'SYSTEM',
                        }}
                    />
                </div>
            </div>
        </>
    )
}