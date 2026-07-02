export const ASGARD_ALLOWED_EMAIL = 'levi@cairn.ing'

export const ASGARD_BASE_URL =
  (import.meta.env.VITE_ASGARD_URL as string | undefined)?.replace(/\/$/, '') ??
  'https://asgard.levismith.us'

export type AsgardSectionKey =
  | 'dns'
  | 'dhcp'
  | 'firewall'
  | 'pihole'
  | 'shares'
  | 'virtual-machines'
  | 'settings'

export type AsgardSection = {
  key: AsgardSectionKey
  title: string
  cairnPath: string
  asgardPath: string
}

export const ASGARD_SECTIONS: AsgardSection[] = [
  { key: 'dns', title: 'DNS', cairnPath: '/apps/asgard/dns', asgardPath: '/dns' },
  { key: 'dhcp', title: 'DHCP', cairnPath: '/apps/asgard/dhcp', asgardPath: '/dhcp' },
  {
    key: 'firewall',
    title: 'Firewall',
    cairnPath: '/apps/asgard/firewall',
    asgardPath: '/firewall',
  },
  { key: 'pihole', title: 'Pi-hole', cairnPath: '/apps/asgard/pihole', asgardPath: '/pihole' },
  {
    key: 'shares',
    title: 'Network Shares',
    cairnPath: '/apps/asgard/shares',
    asgardPath: '/shares',
  },
  {
    key: 'virtual-machines',
    title: 'Virtual Machines',
    cairnPath: '/apps/asgard/virtual-machines',
    asgardPath: '/virtual-machines',
  },
  {
    key: 'settings',
    title: 'Settings',
    cairnPath: '/apps/asgard/settings',
    asgardPath: '/settings',
  },
]

export function asgardSectionForKey(key: string | undefined): AsgardSection | null {
  return ASGARD_SECTIONS.find((section) => section.key === key) ?? null
}

export function asgardEmbedUrl(section: AsgardSection): string {
  const url = new URL(section.asgardPath, ASGARD_BASE_URL)
  url.searchParams.set('embed', 'cairn')
  return url.toString()
}

export function asgardHealthUrl(): string {
  return new URL('/embed/health', ASGARD_BASE_URL).toString()
}
