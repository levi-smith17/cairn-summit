import { useQuery } from '@tanstack/react-query'
import {
  asgardNavUrl,
  mapEmbedNavSections,
  type AsgardNavSection,
} from '@/lib/asgard-embed'

type EmbedNavResponse = {
  sections: Array<{
    key: string
    title: string
    path: string
    icon: string
    enabled: boolean
  }>
  fetchedAt: string
}

async function fetchAsgardNav(): Promise<AsgardNavSection[]> {
  const response = await fetch(asgardNavUrl(), {
    cache: 'no-store',
    credentials: 'omit',
  })
  if (!response.ok) {
    throw new Error(`Asgard nav request failed (${response.status})`)
  }
  const data = (await response.json()) as EmbedNavResponse
  return mapEmbedNavSections(data.sections)
}

export function useAsgardNav(enabled = true) {
  return useQuery({
    queryKey: ['asgard-nav'],
    queryFn: fetchAsgardNav,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
