import { useQuery } from '@tanstack/react-query'
import { asgardHealthUrl } from '@/lib/asgard-embed'

async function checkAsgardAvailability(): Promise<boolean> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 2500)

  try {
    const response = await fetch(asgardHealthUrl(), {
      cache: 'no-store',
      credentials: 'omit',
      mode: 'cors',
      signal: controller.signal,
    })
    return response.ok
  } finally {
    window.clearTimeout(timeout)
  }
}

export function useAsgardAvailability(enabled = true) {
  return useQuery({
    queryKey: ['asgard-availability'],
    queryFn: checkAsgardAvailability,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
}
