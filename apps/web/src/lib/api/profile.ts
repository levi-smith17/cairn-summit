import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface ProfileData {
  username: string | null
  name: string | null
  email: string | null
  image: string | null
  isAdmin: boolean
  signals: number
  itinerary: number
}

export async function getProfile(): Promise<ProfileData | null> {
  try {
    const res = await fetch(`${API_BASE}/profile`, { headers: await getAuthHeaders() })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}
