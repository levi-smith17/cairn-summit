import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL
const CLOUDFRONT_PUBLIC_MEDIA_URL = import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL

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

export async function uploadLogImage(file: File, logId: string): Promise<string> {
    const res = await fetch(`${API_BASE}/logs/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size, logId }),
    })
    if (!res.ok) throw new Error('Failed to get upload URL')
    const { data } = await res.json()
    await fetch(data.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    })
    return data.cloudFrontUrl ?? `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${data.key}`
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