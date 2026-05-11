const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
    return {}
}

export async function getSignals(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/signals`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch signals')
    return res.json()
}

export async function getSignalSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/signals/settings`, {
        headers: await getAuthHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch signal settings')
    return res.json()
}

export async function markMessageRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/signals/${id}/read`, {
        method: 'PUT',
        headers: await getAuthHeaders()
    })
}

export async function deleteMessage(id: string): Promise<void> {
    await fetch(`${API_BASE}/signals/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders()
    })
}

export async function sendReply(signalId: string, body: string): Promise<void> {
    await fetch(`${API_BASE}/signals/${signalId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
        body: JSON.stringify({ body })
    })
}
