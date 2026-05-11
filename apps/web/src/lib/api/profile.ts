const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function getAuthHeaders(): Promise<Record<string, string>> {
  return {}
}

export interface ProfileData {
  username: string | null
  name: string | null
  email: string | null
  image: string | null
  isAdmin: boolean
  signals: number
  itinerary: number
}

export async function getProfile(): Promise<ProfileData> {
  const res = await fetch(`${API_BASE}/me`, { headers: await getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}
