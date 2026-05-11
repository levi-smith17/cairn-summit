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
  return res.json()
}
