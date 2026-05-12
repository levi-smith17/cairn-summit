import type { Marker } from '@cairn/types'
import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getMarkers(): Promise<Marker[]> {
    const res = await fetch(`${API_BASE}/markers`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch markers')
    const json = await res.json()
    return json.data
}

export async function createMarker(data: Partial<Marker>): Promise<Marker> {
    const res = await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create marker')
    const json = await res.json()
    return json.data
}

export async function updateMarker(id: string, data: Partial<Marker>): Promise<Marker> {
    const res = await fetch(`${API_BASE}/markers/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update marker')
    const json = await res.json()
    return json.data
}

export async function deleteMarker(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/markers/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete marker')
}