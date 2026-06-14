import { getAuthHeaders } from '@/lib/api/auth-headers'
import { getSettings } from '@/lib/api/settings'

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

export type CalendarOption = {
  id: string
  name: string
  color: string
}

function mapEvent(e: Record<string, unknown>): ExternalCalendarEvent {
  return {
    uid: e.uid as string,
    title: e.title as string,
    startDate: new Date(e.startDate as string),
    endDate: e.endDate ? new Date(e.endDate as string) : null,
    allDay: e.allDay as boolean,
    location: (e.location as string | null) ?? null,
    notes: (e.notes as string | null) ?? null,
    color: e.color as string,
    readonly: e.readonly as boolean,
    calendarId: e.calendarId as string,
    url: e.url as string,
    recurrenceRule: (e.recurrenceRule as string | null) ?? null,
  }
}

export async function getItineraryCalendars(): Promise<CalendarOption[]> {
  const settings = await getSettings()
  const calendars = (settings.calendars ?? []).map((c: { id: string; name: string; color: string }) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))
  const subscriptions = (settings.calendarSubscriptions ?? []).map((s: { id: string; name: string; color: string }) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }))
  return [...calendars, ...subscriptions]
}

export async function fetchItineraryEvents(params?: {
  from?: string
  to?: string
}): Promise<ExternalCalendarEvent[]> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)

  const query = qs.toString()
  const res = await fetch(`${API_BASE}/itinerary/events${query ? `?${query}` : ''}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) return []
  const json = await res.json()
  const events = (json.data?.events ?? json.events ?? []) as Record<string, unknown>[]
  return events.map(mapEvent)
}

/** @deprecated Read-only itinerary has no manual stops; use fetchItineraryEvents */
export async function fetchExternalCalendarEvents(): Promise<ExternalCalendarEvent[]> {
  return fetchItineraryEvents()
}
