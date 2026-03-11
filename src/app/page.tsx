import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CairnLockup } from '@/components/cairn-lockup'
import { DirectoryTable } from './components/directory-table'
import { DirectoryStats } from './components/directory-stats'
import { PublicNav } from '@/components/nav/public-nav'

export default async function HomePage() {
  const [wayfarers, session] = await Promise.all([
    prisma.wayfarer.findMany({
      where: { listed: true, username: { not: null } },
      include: {
        origins: { select: { location: true } },
        expeditions: { select: { id: true } },
        gear: { select: { name: true }, orderBy: { name: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    auth(),
  ])

  const isLoggedIn = !!session?.user

  // Single wayfarer — redirect to their manifest
  if (!isLoggedIn && wayfarers.length === 1) {
    redirect(`/manifest/${wayfarers[0].username}`)
  }

  const currentUser = session?.user ? {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    avatar: session.user.image ?? null,
  } : null

  // Build table data
  const tableData = wayfarers.map(w => ({
    id: w.id,
    name: w.name,
    email: w.email,
    image: w.image,
    username: w.username,
    location: w.origins?.location ?? null,
    expeditionCount: w.expeditions.length,
    topGear: w.gear.slice(0, 3).map(g => g.name),
    memberSince: w.createdAt,
  }))

  // Stats — top gear
  const gearCounts = wayfarers
    .flatMap(w => w.gear.map(g => g.name))
    .reduce<Record<string, number>>((acc, name) => {
      acc[name] = (acc[name] ?? 0) + 1
      return acc
    }, {})
  const topGear = Object.entries(gearCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // Stats — top locations
  const locationCounts = wayfarers
    .flatMap(w => w.origins?.location ? [w.origins.location] : [])
    .reduce<Record<string, number>>((acc, loc) => {
      acc[loc] = (acc[loc] ?? 0) + 1
      return acc
    }, {})
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, count]) => ({ location, count }))

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 bg-background border-b">
        <CairnLockup className="h-8" />
        <PublicNav currentUser={currentUser} />
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Wayfarer Directory</h1>
          <p className="text-sm text-muted-foreground">
            Explore the community of wayfarers on Cairn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <DirectoryTable data={tableData} />
          </div>
          <div className="lg:col-span-1">
            <DirectoryStats
              totalWayfarers={wayfarers.length}
              topGear={topGear}
              topLocations={topLocations}
            />
          </div>
        </div>
      </div>
    </div>
  )
}