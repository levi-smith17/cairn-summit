import type { Trail } from '@cairn/types'
import { getAuthHeaders } from '@/lib/api/auth-headers'
import { extractId } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL

export async function getTrails(): Promise<Trail[]> {
    const res = await fetch(`${API_BASE}/trails`, {
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch trails')
    const json = await res.json()
    return json.data
}

export async function createTrail(data: { name: string }): Promise<{ id: string; name: string }> {
    const res = await fetch(`${API_BASE}/trails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create trail')
    const json = await res.json()
    const trail: Trail = json.data
    return { id: extractId(trail.sk), name: trail.name }
}

export async function updateTrail(id: string, data: { name: string }): Promise<{ id: string; name: string }> {
    const res = await fetch(`${API_BASE}/trails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update trail')
    const json = await res.json()
    const trail: Trail = json.data
    return { id: extractId(trail.sk), name: trail.name }
}

export async function saveTrail(data: { id?: string; name: string }): Promise<{ id: string; name: string }> {
    if (data.id) return updateTrail(data.id, { name: data.name })
    return createTrail({ name: data.name })
}

export async function deleteTrail(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/trails/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete trail')
}