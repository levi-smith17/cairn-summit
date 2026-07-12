export type PublicManifestView = 'manifest' | 'journey' | 'contact'

export function parsePublicManifestPath(
  pathname: string,
): { username: string; view: PublicManifestView } | null {
  const match = pathname.match(/^\/manifest\/([^/]+)(?:\/(journey|contact))?\/?$/)
  if (!match?.[1]) return null
  const view = (match[2] as 'journey' | 'contact' | undefined) ?? 'manifest'
  return { username: match[1], view }
}

export function publicManifestPath(username: string, view: PublicManifestView = 'manifest'): string {
  if (view === 'journey') return `/manifest/${username}/journey`
  if (view === 'contact') return `/manifest/${username}/contact`
  return `/manifest/${username}`
}
