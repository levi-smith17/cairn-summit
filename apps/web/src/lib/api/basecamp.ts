import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getBasecampData(params?: string): Promise<any> {
  const url = params ? `${API_BASE}/basecamp?${params}` : `${API_BASE}/basecamp`
  const res = await fetch(url, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch basecamp data')
  return res.json()
}

export async function fetchExternalCalendarEvents(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/itinerary/external-events`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.events ?? []
}
