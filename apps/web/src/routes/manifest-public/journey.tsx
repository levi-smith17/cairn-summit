import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getPublicJourney } from '@/lib/api/manifest-public'
import { JourneyContent } from './journey-content'

export default function PublicManifestJourney() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()

  const { data, isError } = useQuery({
    queryKey: ['public-manifest-journey', username],
    queryFn: () => getPublicJourney(username!),
    enabled: !!username,
    retry: false,
  })

  if (isError) return <Navigate to="/" replace />
  if (!data) return null

  const currentWayfarer = user
    ? { name: user.name ?? null, email: user.email, avatar: user.image ?? null }
    : null

  return (
    <JourneyContent
      wayfarer={data.wayfarer}
      origins={data.origins}
      companions={data.companions}
      currentWayfarer={currentWayfarer}
    />
  )
}
