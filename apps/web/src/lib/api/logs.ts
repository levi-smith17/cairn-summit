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

export async function getLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/logs`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch logs')
    const json = await res.json()
    return json.data
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
    const json = await res.json()
    const log = json.data
    return { ...log, id: log.sk?.split('#').pop() }
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
    const json = await res.json()
    const log = json.data
    return { ...log, id: log.sk?.split('#').pop() }
}

export async function saveLog(data: {
    id?: string
    title: string | null
    content: string
    trailId?: string | null
    waypointId?: string | null
    markerIds?: string[]
}): Promise<any> {
    if (data.id) return updateLog(data.id, data)
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