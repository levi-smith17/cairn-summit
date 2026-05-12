import type { Trail } from '@cairn/types'
import { pool } from '@/hooks/use-auth'

const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
    return new Promise((resolve) => {
        const cognitoUser = pool.getCurrentUser()
        if (!cognitoUser) return resolve({})

        cognitoUser.getSession((err: Error | null, session: any) => {
            if (err || !session?.isValid()) return resolve({})
            resolve({ Authorization: session.getIdToken().getJwtToken() })
        })
    })
}

export type TrailWithCount = Trail & { _count: { waypoints: number } }

export async function getTrails(): Promise<TrailWithCount[]> {
    const res = await fetch(`${API_BASE}/trails`, {
        headers: await getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch trails')
    const json = await res.json()
    return json.data
}

export async function createTrail(data: { name: string }): Promise<Trail> {
    const res = await fetch(`${API_BASE}/trails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create trail')
    const json = await res.json()
    return json.data
}

export async function updateTrail(id: string, data: { name: string }): Promise<Trail> {
    const res = await fetch(`${API_BASE}/trails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update trail')
    const json = await res.json()
    return json.data
}

export async function saveTrail(data: { id?: string; name: string }): Promise<Trail> {
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
