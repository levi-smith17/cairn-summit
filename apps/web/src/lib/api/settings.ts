import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getSettings(): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch settings')
  const json = await res.json()
  return json.data ?? json
}

export async function saveAccountSettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/account`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save account settings')
  return res.json()
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${API_BASE}/account`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete account')
}

export async function updateAppearanceSettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/appearance`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update appearance settings')
  return res.json()
}

export async function updateTimeFormat(timeFormat: string): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/account`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ timeFormat }),
  })
  if (!res.ok) throw new Error('Failed to update time format')
  return res.json()
}

export async function updatePrivacySettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/privacy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update privacy settings')
  return res.json()
}

export async function updateListedSetting(listed: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/account`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ listed }),
  })
  if (!res.ok) throw new Error('Failed to update listed setting')
  return res.json()
}

export async function updateLogSettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/logs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update log settings')
  return res.json()
}

export async function updateWaypointSettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/waypoints`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update waypoint settings')
  return res.json()
}

export async function updateItinerarySettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/itinerary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update itinerary settings')
  return res.json()
}

export async function addICloudCalendar(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add calendar')
  return res.json()
}

export async function updateICloudCalendar(id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/itinerary/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update calendar')
  return res.json()
}

export async function deleteICloudCalendar(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/itinerary/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete calendar')
}

export async function addCalendarSubscription(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/itinerary-subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add subscription')
  return res.json()
}

export async function updateCalendarSubscription(id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/itinerary-subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update subscription')
  return res.json()
}

export async function deleteCalendarSubscription(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/itinerary-subscriptions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete subscription')
}

export async function getApiTokenStatus(): Promise<{
  configured: boolean
  tokenPrefix?: string
  createdAt?: string
  lastUsedAt?: string | null
}> {
  const res = await fetch(`${API_BASE}/settings/api-token`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch API token status')
  const json = await res.json()
  return json.data ?? json
}

export async function createApiToken(): Promise<{
  token: string
  tokenPrefix: string
  createdAt: string
}> {
  const res = await fetch(`${API_BASE}/settings/api-token`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to create API token')
  const json = await res.json()
  return json.data ?? json
}

export async function revokeApiToken(): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/api-token`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to revoke API token')
}
