import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getOutpostData } from '@/lib/api/outpost'
import { getPublicJourney, getPublicManifest } from '@/lib/api/manifest-public'
import { resolveProfileImage } from '@/lib/profile-image'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { StudioPageSkeleton } from '@/components/studio/ui/studio-skeletons'
import { OutpostRail } from './home/outpost-rail'
import { ManifestContent } from './manifest-public/manifest-content'
import { JourneyContent } from './manifest-public/journey-content'
import { ContactContent } from './manifest-public/contact-content'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTerminology } from '@/contexts/terminology-context'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'
import { Skeleton } from '@/components/ui/skeleton'
import type { PublicManifestView } from '@/lib/public-manifest-path'

export default function Home() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [canvasView, setCanvasView] = useState<PublicManifestView>('manifest')

  const outpostQuery = useQuery({
    queryKey: ['outpost', user?.id ?? 'anon'],
    queryFn: getOutpostData,
  })

  const wayfarers = outpostQuery.data?.wayfarers ?? []

  // Single listed wayfarer and nothing selected → auto-open in canvas (no URL change)
  useEffect(() => {
    if (outpostQuery.isPending || selectedUsername) return
    const withUsername = wayfarers.filter((w) => w.username)
    if (!user && withUsername.length === 1 && withUsername[0].username) {
      setSelectedUsername(withUsername[0].username)
      setCanvasView('manifest')
    }
  }, [outpostQuery.isPending, user, wayfarers, selectedUsername])

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
    setSelectedUsername(username)
    setCanvasView('manifest')
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
    enabled: !!selectedUsername && canvasView === 'manifest',
    retry: false,
  })

  const journeyQuery = useQuery({
    queryKey: ['public-manifest-journey', selectedUsername],
    queryFn: () => getPublicJourney(selectedUsername!),
    enabled: !!selectedUsername && canvasView === 'journey',
    retry: false,
  })

  if (isInitialRouteLoad([outpostQuery])) {
    return <StudioPageSkeleton />
  }

  let canvas: React.ReactNode

  if (!selectedUsername) {
    canvas = (
      <div className="flex h-full flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-foreground">
            Select a {terms.wayfarers.slice(0, -1).toLowerCase() || 'wayfarer'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose someone from the rail to view their public {terms.manifest.toLowerCase()}.
          </p>
        </div>
      </div>
    )
  } else if (canvasView === 'contact') {
    const wayfarerMeta = wayfarers.find((w) => w.username === selectedUsername)
    const name = wayfarerMeta?.name ?? selectedUsername
    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : '?'
    canvas = (
      <div className="flex h-full min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-muted/50 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage
                src={resolveProfileImage(wayfarerMeta?.image ?? null) ?? undefined}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">
                {terms.contact} {name}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Send a message — your email stays private.
              </p>
            </div>
          </div>
          <ContactContent username={selectedUsername} wayfarerName={wayfarerMeta?.name ?? null} />
        </div>
      </div>
    )
  } else if (canvasView === 'journey') {
    if (journeyQuery.isError) {
      canvas = (
        <div className="flex h-full flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">{terms.bio_button} unavailable</p>
        </div>
      )
    } else if (!journeyQuery.data) {
      canvas = (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      )
    } else {
      canvas = (
        <div className="h-full min-h-0 flex-1 overflow-y-auto">
          <JourneyContent
            wayfarer={{
              ...journeyQuery.data.wayfarer,
              avatar: resolveProfileImage(
                journeyQuery.data.wayfarer.image ?? journeyQuery.data.wayfarer.avatar ?? null,
              ),
            }}
            origins={journeyQuery.data.origins}
            companions={journeyQuery.data.companions}
            onContactClick={() => setCanvasView('contact')}
          />
        </div>
      )
    }
  } else if (manifestQuery.isError) {
    canvas = (
      <div className="flex h-full flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-foreground">{terms.manifest} unavailable</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This {terms.manifest.toLowerCase()} is private or could not be loaded.
          </p>
        </div>
      </div>
    )
  } else if (!manifestQuery.data) {
    canvas = (
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
    )
  } else {
    canvas = (
      <div className="h-full min-h-0 flex-1 overflow-y-auto">
        <ManifestContent
          wayfarer={{
            ...manifestQuery.data.wayfarer,
            avatar: resolveProfileImage(
              manifestQuery.data.wayfarer.image ?? manifestQuery.data.wayfarer.avatar ?? null,
            ),
          }}
          origins={manifestQuery.data.origins}
          expeditions={manifestQuery.data.expeditions}
          training={manifestQuery.data.training}
          gear={manifestQuery.data.gear}
          landmarks={manifestQuery.data.landmarks}
          summits={manifestQuery.data.summits}
          pathfinding={manifestQuery.data.pathfinding}
          onJourneyClick={() => setCanvasView('journey')}
          onContactClick={() => setCanvasView('contact')}
        />
      </div>
    )
  }

  return (
    <StudioLayout
      railLabel={terms.wayfarers}
      contextBar={
        <PlatformStudioContextBar aria-label={terms.outpost} title={terms.outpost} />
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
