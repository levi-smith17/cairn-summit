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

export async function getWaypoints() {
    const res = await fetch(`${API_BASE}/waypoints`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch waypoints')
    return res.json()
}

export async function createWaypoint(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/waypoints`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create waypoint')
    return res.json()
}

export async function updateWaypoint(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/waypoints/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update waypoint')
    return res.json()
}

export async function saveWaypoint(data: Record<string, any>) {
    const { id, ...rest } = data
    if (id) return updateWaypoint(id, rest)
    return createWaypoint(rest)
}

export async function deleteWaypoint(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/waypoints/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete waypoint')
}

export async function toggleWaypointRead(id: string, read: boolean) {
    const res = await fetch(`${API_BASE}/waypoints/${id}/read`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify({ read })
    })
    if (!res.ok) throw new Error('Failed to update waypoint read status')
    return res.json()
}

export async function toggleWaypointReadLater(id: string, readLater: boolean) {
    const res = await fetch(`${API_BASE}/waypoints/${id}/read-later`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders()
        },
        body: JSON.stringify({ readLater })
    })
    if (!res.ok) throw new Error('Failed to update waypoint read-later status')
    return res.json()
}
