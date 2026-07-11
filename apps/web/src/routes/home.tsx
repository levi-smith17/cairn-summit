import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getOutpostData } from '@/lib/api/outpost'
import { getPublicManifest } from '@/lib/api/manifest-public'
import { resolveProfileImage } from '@/lib/profile-image'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { StudioPageSkeleton } from '@/components/studio/ui/studio-skeletons'
import { OutpostRail } from './home/outpost-rail'
import { ManifestContent } from './manifest-public/manifest-content'
import { useWayfarerHeader } from '@/hooks/use-wayfarer-header'
import { useTerminology } from '@/contexts/terminology-context'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const currentWayfarer = useWayfarerHeader()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedUsername = searchParams.get('w')

  const outpostQuery = useQuery({
    queryKey: ['outpost', user?.id ?? 'anon'],
    queryFn: getOutpostData,
  })

  const wayfarers = outpostQuery.data?.wayfarers ?? []

  // Single listed wayfarer and nothing selected → auto-select via URL
  useEffect(() => {
    if (outpostQuery.isPending || selectedUsername) return
    const withUsername = wayfarers.filter((w) => w.username)
    if (!user && withUsername.length === 1 && withUsername[0].username) {
      setSearchParams({ w: withUsername[0].username }, { replace: true })
    }
  }, [outpostQuery.isPending, user, wayfarers, selectedUsername, setSearchParams])

  const filterQuery = searchParams.get('q') ?? ''

  function setFilterQuery(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }

  function selectWayfarer(username: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('w', username)
        return next
      },
      { replace: true },
    )
  }

  const filteredWayfarers = wayfarers.filter((w) => {
    if (!w.username) return false
    if (!filterQuery.trim()) return true
    const q = filterQuery.trim().toLowerCase()
    return (
      (w.name ?? '').toLowerCase().includes(q) ||
      (w.location ?? '').toLowerCase().includes(q) ||
      (w.username ?? '').toLowerCase().includes(q) ||
      (w.email ?? '').toLowerCase().includes(q)
    )
  })

  const manifestQuery = useQuery({
    queryKey: ['public-manifest', selectedUsername],
    queryFn: () => getPublicManifest(selectedUsername!),
    enabled: !!selectedUsername,
    retry: false,
  })

  if (isInitialRouteLoad([outpostQuery])) {
    return <StudioPageSkeleton />
  }

  const canvas = !selectedUsername ? (
    <div className="flex h-full flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-foreground">Select a {terms.wayfarers.slice(0, -1).toLowerCase() || 'wayfarer'}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose someone from the rail to view their public {terms.manifest.toLowerCase()}.
        </p>
      </div>
    </div>
  ) : manifestQuery.isError ? (
    <div className="flex h-full flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-foreground">{terms.manifest} unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This {terms.manifest.toLowerCase()} is private or could not be loaded.
        </p>
      </div>
    </div>
  ) : !manifestQuery.data ? (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2 pt-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  ) : (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <ManifestContent
        embedded
        wayfarer={{
          ...manifestQuery.data.wayfarer,
          avatar: resolveProfileImage(
            manifestQuery.data.wayfarer.image ?? manifestQuery.data.wayfarer.avatar ?? null,
          ),
        }}
        currentWayfarer={currentWayfarer}
        origins={manifestQuery.data.origins}
        expeditions={manifestQuery.data.expeditions}
        training={manifestQuery.data.training}
        gear={manifestQuery.data.gear}
        landmarks={manifestQuery.data.landmarks}
        summits={manifestQuery.data.summits}
        pathfinding={manifestQuery.data.pathfinding}
      />
    </div>
  )

  return (
    <StudioLayout
      railLabel={terms.wayfarers}
      contextBar={
        <PlatformStudioContextBar
          aria-label={terms.outpost}
          title={terms.outpost}
          subtitle={
            selectedUsername
              ? `@${selectedUsername}`
              : `Explore ${terms.wayfarers.toLowerCase()} on Cairn`
          }
        />
      }
      rail={
        <OutpostRail
          wayfarers={filteredWayfarers}
          selectedUsername={selectedUsername}
          filterQuery={filterQuery}
          onFilterQueryChange={setFilterQuery}
          onSelect={selectWayfarer}
          isLoading={outpostQuery.isFetching && !outpostQuery.data}
        />
      }
      canvas={canvas}
    />
  )
}
