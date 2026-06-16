import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useWayfarerHeader } from '@/hooks/use-wayfarer-header'
import { getPublicManifest } from '@/lib/api/manifest-public'
import { resolveProfileImage } from '@/lib/profile-image'
import { ManifestContent } from './manifest-public/manifest-content'
import { ManifestHeaderSkeleton } from './manifest-public/manifest-header'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublicManifest() {
  const { username } = useParams<{ username: string }>()
  const currentWayfarer = useWayfarerHeader()

  const { data, isError } = useQuery({
    queryKey: ['public-manifest', username],
    queryFn: () => getPublicManifest(username!),
    enabled: !!username,
    retry: false,
  })

  if (isError) return <Navigate to="/not-found" replace />

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
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ManifestContent
      wayfarer={{
        ...data.wayfarer,
        avatar: resolveProfileImage(data.wayfarer.image ?? data.wayfarer.avatar ?? null),
      }}
      currentWayfarer={currentWayfarer}
      origins={data.origins}
      expeditions={data.expeditions}
      training={data.training}
      gear={data.gear}
      landmarks={data.landmarks}
      summits={data.summits}
      pathfinding={data.pathfinding}
    />
  )
}
