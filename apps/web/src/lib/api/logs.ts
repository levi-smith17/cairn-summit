const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
    // Will be replaced with Cognito token once auth is set up
    return {}
}

export async function getLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/logs`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch logs')
    return res.json()
}

export async function createLog(data: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create log')
    return res.json()
}

export async function updateLog(id: string, data: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update log')
    return res.json()
}

export async function saveLog(data: {
    id?: string
    title: string | null
    content: string
    trailId?: string | null
    waypointId?: string | null
    markerIds?: string[]
}): Promise<any> {
    if (data.id) {
        return updateLog(data.id, data)
    }
    return createLog(data)
}

export async function deleteLog(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete log')
}

export async function reorderLogs(orderedIds: string[]): Promise<void> {
    const res = await fetch(`${API_BASE}/logs/reorder`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify({ orderedIds })
    })
    if (!res.ok) throw new Error('Failed to reorder logs')
}

export async function getTrails(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/trails`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch trails')
    return res.json()
}

export async function getMarkers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/markers`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch markers')
    return res.json()
}

export async function getWaypoints(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/waypoints`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch waypoints')
    return res.json()
}

export async function createTrail(name: string): Promise<any> {
    const res = await fetch(`${API_BASE}/trails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error('Failed to create trail')
    return res.json()
}
