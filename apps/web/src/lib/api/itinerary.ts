const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
  return {}
}

export type ExternalCalendarEvent = {
  uid: string
  title: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  location: string | null
  notes: string | null
  color: string
  readonly: boolean
  calendarId: string
  url: string
  recurrenceRule: string | null
}

export async function getItineraryData(): Promise<any> {
  const res = await fetch(`${API_BASE}/itinerary`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch itinerary data')
  return res.json()
}

export async function saveStop(data: {
  id?: string
  masterId?: string
  occurrenceDate?: Date
  occurrenceScope?: string
  title: string
  notes: string | null
  location: string | null
  startDate: Date
  endDate: Date | null
  allDay: boolean
  markerIds: string[]
  recurrenceRule?: string | null
  linkedIcloudEventUid?: string | null
  linkedIcloudEventUrl?: string | null
  linkedIcloudCalendarId?: string | null
  targetCalendarId?: string | null
}): Promise<{ icloudError?: string }> {
  const res = await fetch(`${API_BASE}/itinerary/stops${data.id ? `/${data.id}` : ''}`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save stop')
  return res.json()
}

export async function deleteStop(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/itinerary/stops/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete stop')
}

export async function deleteStopOccurrence(data: {
  masterId: string
  occurrenceDate: Date
  scope: string
}): Promise<void> {
  const res = await fetch(`${API_BASE}/itinerary/stops/occurrence`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to delete stop occurrence')
}

export async function deleteICloudEventDirect(calendarId: string, url: string): Promise<void> {
  const res = await fetch(`${API_BASE}/itinerary/icloud-events`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ calendarId, url }),
  })
  if (!res.ok) throw new Error('Failed to delete iCloud event')
}

export async function fetchExternalCalendarEvents(): Promise<ExternalCalendarEvent[]> {
  const res = await fetch(`${API_BASE}/itinerary/external-events`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.events ?? []).map((e: any) => ({
    ...e,
    startDate: new Date(e.startDate),
    endDate: e.endDate ? new Date(e.endDate) : null,
  }))
}
