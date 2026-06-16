import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getProfile } from '@/lib/api/profile'
import { resolveProfileImage } from '@/lib/profile-image'

export function useWayfarerHeader() {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user,
  })

  if (!user) return null

  return {
    name: profile?.name ?? user.name ?? null,
    email: profile?.email ?? user.email ?? null,
    avatar: resolveProfileImage(profile?.image ?? user.image ?? null),
  }
}
