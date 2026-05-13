import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getGuides(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/guides`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch guides')
    const json = await res.json()
    return json.data ?? []
}

export async function getGuide(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/guides/${id}`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch guide')
    const json = await res.json()
    return json.data
}

export async function saveGuide(data: {
    id?: string
    name: string
    description?: string | null
    trailId?: string | null
}): Promise<any> {
    const { id, ...body } = data
    const url = id ? `${API_BASE}/guides/${id}` : `${API_BASE}/guides`
    const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to save guide')
    return res.json()
}

export async function deleteGuide(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/guides/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete guide')
}

export async function getStones(guideId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/guides/${guideId}/stones`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch stones')
    const json = await res.json()
    return json.data ?? []
}

export async function saveStone(data: {
    id?: string
    face: string
    core: string
    guideId: string
    markerIds?: string[]
}): Promise<any> {
    const { id, guideId, ...body } = data
    const url = id ? `${API_BASE}/stones/${id}` : `${API_BASE}/guides/${guideId}/stones`
    const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to save stone')
    return res.json()
}

export async function deleteStone(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/stones/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete stone')
}

export async function importStones(
    guideId: string,
    stones: { face: string; core: string; markerIds: string[] }[]
): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/guides/${guideId}/stones/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify({ stones })
    })
    if (!res.ok) throw new Error('Failed to import stones')
    return res.json()
}

export async function updateStonePlacement(id: string, placement: string): Promise<void> {
    await fetch(`${API_BASE}/stones/${id}/placement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify({ placement })
    })
}

export async function resetGuidePlacements(guideId: string): Promise<void> {
    await fetch(`${API_BASE}/guides/${guideId}/placements/reset`, {
        method: 'POST',
        headers: await getAuthHeaders()
    })
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
