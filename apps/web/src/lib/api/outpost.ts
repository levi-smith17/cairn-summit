import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface OutpostWayfarer {
  id: string
  name: string | null
  email: string | null
  image: string | null
  username: string | null
  location: string | null
  expeditionCount: number
  topGear: string[]
  memberSince: string
}

export interface OutpostData {
  wayfarers: OutpostWayfarer[]
}

export async function getOutpostData(): Promise<OutpostData> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/outpost`, { headers })
  if (!res.ok) throw new Error('Failed to fetch outpost data')
  const json = await res.json()
  return json.data
}
