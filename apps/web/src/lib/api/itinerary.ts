import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

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

export async function getItineraryData(): Promise<{ stops: any[]; calendars: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/itinerary`, {
      headers: await getAuthHeaders(),
    })
    if (!res.ok) return { stops: [], calendars: [] }
    return res.json()
  } catch {
    return { stops: [], calendars: [] }
  }
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
