const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface ThreadReply {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  createdAt: string
}

export interface ThreadData {
  id: string
  senderName: string | null
  body: string
  createdAt: string
  tokenExpiresAt: string | null
  wayfarer: {
    name: string | null
    image: string | null
    username: string | null
  }
  replies: ThreadReply[]
}

export async function getThread(token: string): Promise<ThreadData> {
  const res = await fetch(`${API_BASE}/public/thread/${token}`)
  if (!res.ok) throw new Error('Thread not found')
  return res.json()
}

export async function sendThreadReply(
  token: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/public/thread/${token}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: html }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body.message ?? 'Failed to send reply' }
  }
  return { ok: true }
}
