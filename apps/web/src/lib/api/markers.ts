import type { Marker } from '@cairn/types'
import { pool } from '@/hooks/use-auth'

const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
    return new Promise((resolve) => {
        const cognitoUser = pool.getCurrentUser()
        if (!cognitoUser) return resolve({})

        cognitoUser.getSession((err: Error | null, session: any) => {
            if (err || !session?.isValid()) return resolve({})
            resolve({
                Authorization: session.getIdToken().getJwtToken()
            })
        })
    })
}

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