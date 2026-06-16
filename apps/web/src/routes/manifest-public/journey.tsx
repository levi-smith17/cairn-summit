import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useWayfarerHeader } from '@/hooks/use-wayfarer-header'
import { resolveProfileImage } from '@/lib/profile-image'
import { getPublicJourney } from '@/lib/api/manifest-public'
import { JourneyContent } from './journey-content'
import { ManifestHeaderSkeleton } from './manifest-header'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublicManifestJourney() {
  const { username } = useParams<{ username: string }>()
  const currentWayfarer = useWayfarerHeader()

  const { data, isError } = useQuery({
    queryKey: ['public-manifest-journey', username],
    queryFn: () => getPublicJourney(username!),
    enabled: !!username,
    retry: false,
  })

  if (isError) return <Navigate to="/" replace />

  if (!data) {
    return (
      <div className="relative">
        <ManifestHeaderSkeleton />
        <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-8 pt-8">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          {[1, 2].map(i => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <JourneyContent
      wayfarer={{
        ...data.wayfarer,
        avatar: resolveProfileImage(data.wayfarer.image ?? data.wayfarer.avatar ?? null),
      }}
      origins={data.origins}
      companions={data.companions}
      currentWayfarer={currentWayfarer}
    />
  )
}
