const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface InviteData {
  email: string
  note: string | null
  expiresAt: string
  usedAt: string | null
  invitedBy: { name: string | null; email: string | null }
}

export async function getInvite(token: string): Promise<InviteData> {
  const res = await fetch(`${API_BASE}/public/invite/${token}`)
  if (!res.ok) throw new Error('Invite not found')
  const json = await res.json()
  return json.data ?? json
}

export async function acceptInvite(token: string, email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/public/invite/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to accept invitation')
}
