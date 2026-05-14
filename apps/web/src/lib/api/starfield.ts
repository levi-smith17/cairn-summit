import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

async function apiFetch(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...options.headers, ...await getAuthHeaders() },
    })
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    if (res.status === 204) return null
    const json = await res.json()
    return json.data ?? json
}

// ── Networks ──────────────────────────────────────────────────────────────────

export async function getNetworks(): Promise<any[]> {
    return apiFetch(`${API_BASE}/starfield/networks`) ?? []
}

export async function createNetwork(data: { name: string }): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/networks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function renameNetwork(id: string, name: string): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/networks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
}

export async function deleteNetwork(id: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/networks/${id}`, { method: 'DELETE' })
}

// ── Facilities ────────────────────────────────────────────────────────────────

export async function getAllFacilities(): Promise<any[]> {
    return apiFetch(`${API_BASE}/starfield/facilities`) ?? []
}

export async function createFacility(data: {
    networkId: string
    name: string
    abbreviation: string
    system: string
    planet: string
    parentId?: string
    transferStationLimit?: number
}): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function updateFacility(id: string, data: Record<string, unknown>): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/facilities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function deleteFacility(id: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/facilities/${id}`, { method: 'DELETE' })
}

export async function updateFacilityPosition(id: string, position: { x: number; y: number }): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/facilities/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position),
    })
}

export async function upsertFacilityResource(
    facilityId: string,
    resourceId: string,
    data: { onsite: boolean; fromFacilityId?: string | null; relay?: { planet: string; system: string } | null }
): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/facilities/${facilityId}/resources/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function removeFacilityResource(facilityId: string, resourceId: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/facilities/${facilityId}/resources/${resourceId}`, {
        method: 'DELETE',
    })
}

// ── Resources ─────────────────────────────────────────────────────────────────

export async function getResources(): Promise<any[]> {
    return apiFetch(`${API_BASE}/starfield/resources`) ?? []
}

export async function saveResource(data: {
    id?: string
    name: string
    abbreviation: string
    type: string
    tier?: number | null
    mined?: boolean
    ingredients?: string[]
}): Promise<any> {
    const { id, ...body } = data
    const method = id ? 'PUT' : 'POST'
    const url = id ? `${API_BASE}/starfield/resources/${id}` : `${API_BASE}/starfield/resources`
    return apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

export async function deleteResource(id: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/resources/${id}`, { method: 'DELETE' })
}

// ── Composite ─────────────────────────────────────────────────────────────────

export async function fetchStarfieldData() {
    const [networks, facilities, resources] = await Promise.all([
        getNetworks(),
        getAllFacilities(),
        getResources(),
    ])

    return {
        networks: networks ?? [],
        facilities: (facilities ?? []).map((f: any) => ({
            ...f,
            id: f.id ?? f.sk?.replace(/^SF#FACILITY#/, ''),
        })),
        resources: (resources ?? []).map((r: any) => ({
            ...r,
            id: r.id ?? r.sk?.replace(/^RESOURCE#/, ''),
        })),
        resourceTypes: [],
        systems: [],
    }
}
