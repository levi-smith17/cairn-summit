const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
    // Will be replaced with Cognito token once auth is set up
    return {}
}

export async function getTrails(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/trails`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch trails')
    return res.json()
}

export async function createTrail(data: { name: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/trails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create trail')
    return res.json()
}

export async function updateTrail(id: string, data: { name: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/trails/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update trail')
    return res.json()
}

export async function saveTrail(data: { id?: string; name: string }): Promise<any> {
    if (data.id) {
        return updateTrail(data.id, { name: data.name })
    }
    return createTrail({ name: data.name })
}

export async function deleteTrail(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/trails/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete trail')
}
