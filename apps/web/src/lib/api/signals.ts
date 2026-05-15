import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getSignals(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/signals`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch signals')
    const json = await res.json()
    return json.data ?? json
}

export async function getSignalSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/signals/settings`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch signal settings')
    const json = await res.json()
    return json.data ?? json
}

export async function markMessageRead(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/signals/${id}/read`, {
        method: 'PUT',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to mark signal as read')
}

export async function deleteMessage(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/signals/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete signal')
}

export async function sendReply(signalId: string, body: string): Promise<void> {
    const res = await fetch(`${API_BASE}/signals/${signalId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify({ body })
    })
    if (!res.ok) throw new Error('Failed to send reply')
}
