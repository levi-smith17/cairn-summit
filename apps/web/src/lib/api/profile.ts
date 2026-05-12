import { pool } from '@/hooks/use-auth'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function getAuthHeaders(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const cognitoUser = pool.getCurrentUser()
    if (!cognitoUser) return resolve({})
    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session?.isValid()) return resolve({})
      resolve({ Authorization: session.getIdToken().getJwtToken() })
    })
  })
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
