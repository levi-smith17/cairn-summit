import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { getPublicManifest } from '@/lib/api/manifest-public'
import { parsePublicManifestPath, type PublicManifestView } from '@/lib/public-manifest-path'

/** Resolves wayfarer identity for public `/manifest/:username` routes (sidebar + headers). */
export function usePublicProfileRoute(): {
  username: string | null
  view: PublicManifestView | null
  displayName: string | null
  isLoading: boolean
} {
  const { pathname } = useLocation()
  const parsed = parsePublicManifestPath(pathname)

  const profileQuery = useQuery({
    queryKey: ['public-manifest', parsed?.username],
    queryFn: () => getPublicManifest(parsed!.username),
    enabled: Boolean(parsed?.username),
    retry: false,
    staleTime: 60_000,
  })

  const displayName =
    profileQuery.data?.wayfarer.name?.trim() ||
    profileQuery.data?.wayfarer.username ||
    parsed?.username ||
    null

  return {
    username: parsed?.username ?? null,
    view: parsed?.view ?? null,
    displayName,
    isLoading: Boolean(parsed?.username) && profileQuery.isPending,
  }
}
