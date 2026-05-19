import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getPublicManifest } from '@/lib/api/manifest-public'
import { ManifestContent } from './manifest-public/manifest-content'

export default function PublicManifest() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()

  const { data, isError } = useQuery({
    queryKey: ['public-manifest', username],
    queryFn: () => getPublicManifest(username!),
    enabled: !!username,
    retry: false,
  })

  if (isError) return <Navigate to="/not-found" replace />
  if (!data) return null

  const currentWayfarer = user
    ? { name: user.name ?? null, email: user.email, avatar: user.image ?? null }
    : null

  return (
    <ManifestContent
      wayfarer={data.wayfarer}
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
