import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export interface BasecampParams {
  page?: number
  search?: string
  markerId?: string
  trailId?: string
  sort?: 'alpha' | 'newest' | 'oldest'
  readLater?: boolean
  dateFrom?: string
  dateTo?: string
}

export async function getBasecamp(params: BasecampParams = {}) {
  const qs = new URLSearchParams()
  if (params.page)      qs.set('page', String(params.page))
  if (params.search)    qs.set('search', params.search)
  if (params.markerId)  qs.set('markerId', params.markerId)
  if (params.trailId)   qs.set('trailId', params.trailId)
  if (params.sort)      qs.set('sort', params.sort)
  if (params.readLater) qs.set('readLater', 'true')
  if (params.dateFrom)  qs.set('dateFrom', params.dateFrom)
  if (params.dateTo)    qs.set('dateTo', params.dateTo)

  const res = await fetch(`${API_BASE}/basecamp?${qs.toString()}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch basecamp')
  const json = await res.json()
  return json.data as {
    folders: Folder[]
    hasMore: boolean
    tags: Tag[]
    allFolders: { id: string; name: string }[]
    filteredCountMap: Record<string, number>
  }
}

export async function getBasecampSidebar() {
  const res = await fetch(`${API_BASE}/basecamp/sidebar`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch sidebar')
  const json = await res.json()
  return json.data as SidebarData
}

// ─── Types (inline until @cairn/types is updated) ─────────────────────────────

interface Tag {
  id: string
  name: string
  color: string
  icon: string | null
}

interface MarkerEntry {
  markerId: string
  marker: Tag
}

interface LogEntry {
  id: string
  content: string
  trailId: string | null
  waypointId: string | null
  markers: MarkerEntry[]
  createdAt: string
}

interface Waypoint {
  id: string
  title: string
  url: string
  favicon: string | null
  read: boolean
  readLater: boolean
  trailId: string | null
  markers: MarkerEntry[]
  createdAt: string
  logs: LogEntry[]
}

interface Folder {
  id: string
  name: string
  waypoints: Waypoint[]
  _count: {
    waypoints: number
    logs: number
  }
}

interface SidebarData {
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
    username: string | null
    origins: {
      headline: string | null
      location: string | null
      website: string | null
      linkedin: string | null
      github: string | null
    }
  }
  manifestCounts: {
    expeditions: number
    training: number
    gear: number
    landmarks: number
    summits: number
    pathfinding: number
    companions: number
  }
  manifestHighlights: {
    totalYearsExperience: number
    mostRecentExpedition: { title: string; company: string } | null
    mostRecentTraining: { institution: string; degree: string | null } | null
    topGear: { name: string }[]
  }
  provisionsSummary: {
    monthlyTotal: number
    monthlyBurn: number
    cacheTotalLimit: number
    cacheTotalSpent: number
    activeCount: number
    upcomingRenewals: number
  }
  signalsSummary: {
    unreadCount: number
    latestMessages: {
      id: string
      senderName: string
      body: string
      createdAt: string
      read: boolean
    }[]
    emailAccounts: string[]
  }
  itinerarySummary: {
    stops: {
      id: string
      title: string
      startDate: string
      endDate: string | null
      allDay: boolean
      color: string
    }[]
  }
}