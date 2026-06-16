import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getOutpostData } from '@/lib/api/outpost'
import { FooterNav } from '@/components/nav/footer'
import { PublicHeader } from '@/components/nav/public/public-header'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { OutpostSkeleton } from '@/components/ui/page-skeleton'
import { OutpostTable } from './home/outpost-table'
import { OutpostStats } from './home/outpost-stats'
import { useTerminology } from '@/contexts/terminology-context'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { terms } = useTerminology()

  const outpostQuery = useQuery({
    queryKey: ['outpost'],
    queryFn: getOutpostData,
  })

  const wayfarers = outpostQuery.data?.wayfarers ?? []

  // Single listed wayfarer and not logged in → go straight to their manifest
  useEffect(() => {
    if (!outpostQuery.isPending && !user && wayfarers.length === 1 && wayfarers[0].username) {
      navigate(`/manifest/${wayfarers[0].username}`, { replace: true })
    }
  }, [outpostQuery.isPending, user, wayfarers, navigate])

  // Stats — top gear
  const gearCounts = wayfarers
    .flatMap(w => w.topGear)
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
    .flatMap(w => w.location ? [w.location] : [])
    .reduce<Record<string, number>>((acc, loc) => {
      acc[loc] = (acc[loc] ?? 0) + 1
      return acc
    }, {})
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, count]) => ({ location, count }))

  if (isInitialRouteLoad([outpostQuery])) {
    if (user) {
      return (
        <>
          <PlatformHeader title={terms.outpost} />
          <OutpostSkeleton />
        </>
      )
    }
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 border-b">
          <img src="/cairn-lockup.png" alt="Cairn Summit Lockup" height={50} width={160} />
          <PublicHeader wayfarer={null} />
        </header>
        <div className="max-w-7xl mx-auto w-full">
          <OutpostSkeleton />
        </div>
        <FooterNav showCairn={true} />
      </div>
    )
  }

  const content = (
    <div className="w-full px-4 py-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1 bg-card rounded-xl px-6 py-4">
        <h1 className="text-2xl font-semibold">{terms.outpost}</h1>
        <p className="text-sm text-muted-foreground">
          Explore the community of {terms.wayfarers.toLowerCase()} on Cairn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-card rounded-xl p-4">
          <OutpostTable data={wayfarers} />
        </div>
        <div className="lg:col-span-1">
          <OutpostStats
            totalWayfarers={wayfarers.length}
            topGear={topGear}
            topLocations={topLocations}
            terms={terms}
          />
        </div>
      </div>
    </div>
  )

  if (user) {
    return (
      <>
        <PlatformHeader title={terms.outpost} />
        {content}
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-header px-6 py-3 border-b">
        <img src="/cairn-lockup.png" alt="Cairn Summit Lockup" height={50} width={160} />
        <PublicHeader wayfarer={null} />
      </header>

      <div className="max-w-7xl mx-auto w-full">
        {content}
      </div>

      <FooterNav showCairn={true} />
    </div>
  )
}
