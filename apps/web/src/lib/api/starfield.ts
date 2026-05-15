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

export async function createNetwork(data: { name: string; abbreviation: string }): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/networks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function updateNetwork(id: string, data: { name: string; abbreviation: string }): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/networks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function deleteNetwork(id: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/networks/${id}`, { method: 'DELETE' })
}

// ── Outposts ──────────────────────────────────────────────────────────────────

export async function getAllOutposts(): Promise<any[]> {
    return apiFetch(`${API_BASE}/starfield/outposts`) ?? []
}

export async function createOutpost(data: {
    networkId: string
    system: string
    planet: string
    parentId?: string
    transferStationLimit?: number
}): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/outposts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function updateOutpost(id: string, data: Record<string, unknown>): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/outposts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function deleteOutpost(id: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/outposts/${id}`, { method: 'DELETE' })
}

export async function updateOutpostPosition(id: string, position: { x: number; y: number }): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/outposts/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position),
    })
}

export async function upsertOutpostResource(
    outpostId: string,
    resourceId: string,
    data: { onsite: boolean; fromOutpostId?: string | null; fromPlanet?: string | null; fromSystem?: string | null; origin?: boolean; relay?: { planet: string; system: string } | null }
): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/outposts/${outpostId}/resources/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
}

export async function removeOutpostResource(outpostId: string, resourceId: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/outposts/${outpostId}/resources/${resourceId}`, {
        method: 'DELETE',
    })
}

// ── Systems ───────────────────────────────────────────────────────────────────

export async function getSystems(): Promise<any[]> {
    return apiFetch(`${API_BASE}/starfield/systems`) ?? []
}

export async function createSystem(name: string): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
}

export async function updateSystem(id: string, name: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/systems/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
}

export async function deleteSystem(id: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/systems/${id}`, { method: 'DELETE' })
}

export async function addPlanet(systemId: string, name: string): Promise<any> {
    return apiFetch(`${API_BASE}/starfield/systems/${systemId}/planets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
}

export async function updatePlanet(systemId: string, planetId: string, name: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/systems/${systemId}/planets/${planetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
}

export async function deletePlanet(systemId: string, planetId: string): Promise<void> {
    await apiFetch(`${API_BASE}/starfield/systems/${systemId}/planets/${planetId}`, {
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
    const [networks, outposts, resources, systems] = await Promise.all([
        getNetworks(),
        getAllOutposts(),
        getResources(),
        getSystems(),
    ])

    return {
        networks: networks ?? [],
        outposts: (outposts ?? []).map((f: any) => ({
            ...f,
            id: f.id ?? f.sk?.replace(/^SF#FACILITY#/, ''),
        })),
        resources: (resources ?? []).map((r: any) => ({
            ...r,
            id: r.id ?? r.sk?.replace(/^RESOURCE#/, ''),
        })),
        resourceTypes: [],
        systems: systems ?? [],
    }
}
