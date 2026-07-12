import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useTerminology } from '@/contexts/terminology-context'
import { resolveProfileImage } from '@/lib/profile-image'
import {
  getPublicContact,
  getPublicJourney,
  getPublicManifest,
} from '@/lib/api/manifest-public'
import type { PublicManifestView } from '@/lib/public-manifest-path'
import { ManifestContent } from './manifest-content'
import { JourneyContent } from './journey-content'
import { ContactContent } from './contact-content'

function pageTitle(view: PublicManifestView, terms: { manifest: string; bio_button: string; contact: string }) {
  if (view === 'journey') return terms.bio_button
  if (view === 'contact') return terms.contact
  return terms.manifest
}

export default function PublicProfilePage({ view }: { view: PublicManifestView }) {
  const { username } = useParams<{ username: string }>()
  const { terms } = useTerminology()
  const title = pageTitle(view, terms)

  const manifestQuery = useQuery({
    queryKey: ['public-manifest', username],
    queryFn: () => getPublicManifest(username!),
    enabled: !!username && view === 'manifest',
    retry: false,
  })

  const journeyQuery = useQuery({
    queryKey: ['public-manifest-journey', username],
    queryFn: () => getPublicJourney(username!),
    enabled: !!username && view === 'journey',
    retry: false,
  })

  const contactQuery = useQuery({
    queryKey: ['public-manifest-contact', username],
    queryFn: () => getPublicContact(username!),
    enabled: !!username && view === 'contact',
    retry: false,
  })

  if (!username) return <Navigate to="/" replace />

  const isError =
    (view === 'manifest' && manifestQuery.isError) ||
    (view === 'journey' && journeyQuery.isError) ||
    (view === 'contact' && contactQuery.isError)

  if (isError) return <Navigate to="/" replace />

  let body: React.ReactNode = null

  if (view === 'manifest') {
    if (!manifestQuery.data) {
      body = (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2 pt-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      )
    } else {
      body = (
        <div className="min-h-0 flex-1 overflow-y-auto">
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
          />
        </div>
      )
    }
  } else if (view === 'journey') {
    if (!journeyQuery.data) {
      body = (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
      )
    } else {
      body = (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <JourneyContent
            wayfarer={{
              ...journeyQuery.data.wayfarer,
              avatar: resolveProfileImage(
                journeyQuery.data.wayfarer.image ?? journeyQuery.data.wayfarer.avatar ?? null,
              ),
            }}
            origins={journeyQuery.data.origins}
            companions={journeyQuery.data.companions}
          />
        </div>
      )
    }
  } else if (contactQuery.data) {
    const { wayfarer } = contactQuery.data
    const initials = wayfarer.name
      ? wayfarer.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : wayfarer.email?.[0].toUpperCase() ?? '?'

    body = (
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-muted/50 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={resolveProfileImage(wayfarer.image) ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">
                {terms.contact} {wayfarer.name ?? username}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Send a message — your email stays private.
              </p>
            </div>
          </div>
          <ContactContent username={username} wayfarerName={wayfarer.name} />
        </div>
      </div>
    )
  } else {
    body = (
      <div className="flex flex-1 items-center justify-center p-8">
        <Skeleton className="h-48 w-full max-w-md rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PlatformStudioContextBar aria-label={title} title={title} />
      {body}
    </div>
  )
}
