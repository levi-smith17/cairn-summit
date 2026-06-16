const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface PublicManifestData {
  wayfarer: {
    username: string
    name: string | null
    email: string | null
    image?: string | null
    avatar?: string | null
    defaultTerminology: 'CAIRN' | 'STANDARD'
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
  }
  origins: {
    headline: string | null
    summary: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
  } | null
  expeditions: any[]
  training: any[]
  gear: any[]
  landmarks: any[]
  summits: any[]
  pathfinding: any[]
}

export async function getPublicManifest(username: string): Promise<PublicManifestData> {
  const res = await fetch(`${API_BASE}/public/manifest/${username}`)
  if (!res.ok) throw new Error('Manifest not found')
  return res.json()
}

export interface PublicJourneyData {
  wayfarer: PublicManifestData['wayfarer']
  origins: {
    headline: string | null
    summary: string | null
    bio: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
  } | null
  companions: any[]
}

export async function getPublicJourney(username: string): Promise<PublicJourneyData> {
  const res = await fetch(`${API_BASE}/public/manifest/${username}/journey`)
  if (!res.ok) throw new Error('Journey not found')
  return res.json()
}

export interface PublicContactData {
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
    defaultTerminology: 'CAIRN' | 'STANDARD'
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
  }
}

export async function getPublicContact(username: string): Promise<PublicContactData> {
  const res = await fetch(`${API_BASE}/public/manifest/${username}/contact`)
  if (!res.ok) throw new Error('Contact not found')
  return res.json()
}
