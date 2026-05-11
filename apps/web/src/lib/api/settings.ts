const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
  return {}
}

export async function getSettings(): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
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

export async function updateNotificationSettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update notification settings')
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

export async function updateSignalSettings(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings/signals`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update signal settings')
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
  const res = await fetch(`${API_BASE}/calendars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add calendar')
  return res.json()
}

export async function updateICloudCalendar(id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/calendars/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update calendar')
  return res.json()
}

export async function deleteICloudCalendar(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/calendars/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete calendar')
}

export async function addCalendarSubscription(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/calendar-subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add subscription')
  return res.json()
}

export async function updateCalendarSubscription(id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/calendar-subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update subscription')
  return res.json()
}

export async function deleteCalendarSubscription(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/calendar-subscriptions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete subscription')
}
