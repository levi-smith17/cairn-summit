export const ASGARD_ALLOWED_EMAIL = 'levi@cairn.ing'

export const ASGARD_BASE_URL =
  (import.meta.env.VITE_ASGARD_URL as string | undefined)?.replace(/\/$/, '') ??
  'https://asgard.cairn.ing'

export type AsgardNavSection = {
  key: string
  title: string
  cairnPath: string
  asgardPath: string
  icon: string
  enabled: boolean
}

export function asgardCairnPath(key: string): string {
  return `/apps/asgard/${key}`
}

export function asgardSectionForKey(
  key: string | undefined,
  sections: AsgardNavSection[],
): AsgardNavSection | null {
  if (!key) return null
  return sections.find((section) => section.key === key) ?? null
}

export function asgardEmbedUrl(section: AsgardNavSection): string {
  const url = new URL(section.asgardPath, ASGARD_BASE_URL)
  url.searchParams.set('embed', 'cairn')
  return url.toString()
}

export function asgardHealthUrl(): string {
  return new URL('/embed/health', ASGARD_BASE_URL).toString()
}

export function asgardNavUrl(): string {
  return new URL('/embed/nav', ASGARD_BASE_URL).toString()
}

export function mapEmbedNavSections(
  sections: Array<{
    key: string
    title: string
    path: string
    icon: string
    enabled: boolean
  }>,
): AsgardNavSection[] {
  return sections
    .filter((section) => section.enabled)
    .map((section) => ({
      key: section.key,
      title: section.title,
      cairnPath: asgardCairnPath(section.key),
      asgardPath: section.path,
      icon: section.icon,
      enabled: section.enabled,
    }))
}
