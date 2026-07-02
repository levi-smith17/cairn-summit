import { useQuery } from '@tanstack/react-query'
import { asgardHealthUrl } from '@/lib/asgard-embed'

async function checkAsgardAvailability(): Promise<boolean> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 2500)

  try {
    // We only care about reachability: asgard.levismith.us resolves solely on
    // the internal network. `no-cors` avoids a cross-origin CORS failure — an
    // opaque response still resolves the promise, while a DNS/connection error
    // (off-network) or the abort timeout rejects it.
    await fetch(asgardHealthUrl(), {
      cache: 'no-store',
      credentials: 'omit',
      mode: 'no-cors',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
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
