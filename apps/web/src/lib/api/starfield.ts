const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
    return {}
}

// ── Systems ───────────────────────────────────────────────────────────────────

export async function saveSystem(data: { id?: string; name: string }) {
    const method = data.id ? 'PUT' : 'POST'
    const url = data.id ? `${API_BASE}/starfield/systems/${data.id}` : `${API_BASE}/starfield/systems`
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save system')
    return res.json()
}

export async function deleteSystem(id: string) {
    const res = await fetch(`${API_BASE}/starfield/systems/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete system')
}

// ── Planets ───────────────────────────────────────────────────────────────────

export async function savePlanet(data: { id?: string; name: string; systemId: string }) {
    const method = data.id ? 'PUT' : 'POST'
    const url = data.id ? `${API_BASE}/starfield/planets/${data.id}` : `${API_BASE}/starfield/planets`
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save planet')
    return res.json()
}

export async function deletePlanet(id: string) {
    const res = await fetch(`${API_BASE}/starfield/planets/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete planet')
}

// ── Networks ──────────────────────────────────────────────────────────────────

export async function getNetworks() {
    const res = await fetch(`${API_BASE}/starfield/networks`, { headers: await getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch networks')
    return res.json()
}

export async function createNetwork(data: { name: string }) {
    const res = await fetch(`${API_BASE}/starfield/networks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create network')
    return res.json()
}

// ── Facilities ────────────────────────────────────────────────────────────────

export async function getFacilities(networkId: string) {
    const res = await fetch(`${API_BASE}/starfield/networks/${networkId}/facilities`, { headers: await getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch facilities')
    return res.json()
}

export async function getFacilitiesPageData(): Promise<{ facilities: any[]; resources: any[]; systems: any[] }> {
    const res = await fetch(`${API_BASE}/starfield/facilities`, { headers: await getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch facilities page data')
    return res.json()
}

export async function getResourcesPageData(page: number, pageSize: number): Promise<{
    resources: any[]
    resourceTypes: any[]
    totalCount: number
}> {
    const res = await fetch(`${API_BASE}/starfield/resources?page=${page}&pageSize=${pageSize}`, { headers: await getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch resources page data')
    return res.json()
}

export async function saveFacilityResource(data: {
    id?: string
    facilityId: string
    resourceId: string
    planetId: string
    subfacility1Id: string | null
    subfacility2Id: string | null
    subfacility3Id: string | null
    relayId: string | null
    onsite: boolean
}) {
    const method = data.id ? 'PUT' : 'POST'
    const url = data.id
        ? `${API_BASE}/starfield/facility-resources/${data.id}`
        : `${API_BASE}/starfield/facility-resources`
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save facility resource')
    return res.json()
}

export async function deleteFacilityResource(id: string) {
    const res = await fetch(`${API_BASE}/starfield/facility-resources/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete facility resource')
}

export async function saveFacility(data: Record<string, unknown>) {
    const method = data.id ? 'PUT' : 'POST'
    const url = data.id ? `${API_BASE}/starfield/facilities/${data.id}` : `${API_BASE}/starfield/facilities`
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save facility')
    return res.json()
}

export async function deleteFacility(id: string) {
    const res = await fetch(`${API_BASE}/starfield/facilities/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete facility')
}

// ── Resources ─────────────────────────────────────────────────────────────────

export async function getResources(page?: number, pageSize?: number) {
    const params = page != null ? `?page=${page}&pageSize=${pageSize ?? 25}` : ''
    const res = await fetch(`${API_BASE}/starfield/resources${params}`, { headers: await getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch resources')
    return res.json()
}

export async function saveResource(data: Record<string, unknown>) {
    const method = data.id ? 'PUT' : 'POST'
    const url = data.id ? `${API_BASE}/starfield/resources/${data.id}` : `${API_BASE}/starfield/resources`
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save resource')
    return res.json()
}

export async function deleteResource(id: string) {
    const res = await fetch(`${API_BASE}/starfield/resources/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete resource')
}
