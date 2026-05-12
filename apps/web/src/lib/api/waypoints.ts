import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getWaypoints() {
    const res = await fetch(`${API_BASE}/waypoints`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch waypoints')
    const json = await res.json()
    return json.data
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
    const json = await res.json()
    const waypoint = json.data
    return { ...waypoint, id: waypoint.sk?.split('#').pop() }
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
    const json = await res.json()
    const waypoint = json.data
    return { ...waypoint, id: waypoint.sk?.split('#').pop() }
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
    const res = await fetch(`${API_BASE}/waypoints/${id}`, {
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
    const res = await fetch(`${API_BASE}/waypoints/${id}`, {
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
