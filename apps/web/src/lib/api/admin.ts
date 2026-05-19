import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export interface WayfarerSummary {
  id: string
  name: string | null
  email: string | null
  username: string | null
  customDomain: string | null
  isAdmin: boolean
  listed: boolean
  createdAt: string
}

export interface InvitationSummary {
  id: string
  email: string
  note: string | null
  invitedBy: { name: string | null; email: string | null }
  expiresAt: string
  usedAt: string | null
  createdAt: string
  token: string | null
}

export interface ActivityEntry {
  id: string
  action: string
  targetId: string | null
  targetEmail: string | null
  metadata: unknown
  createdAt: string
  admin: { name: string | null; email: string | null }
}

export interface AdminData {
  wayfarers: WayfarerSummary[]
  invitations: InvitationSummary[]
  activities: ActivityEntry[]
}

export async function getAdminData(): Promise<AdminData> {
  const res = await fetch(`${API_BASE}/admin`, { headers: await getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch admin data')
  const body = await res.json()
  return body.data
}

export async function saveWayfarer(data: {
  id?: string
  name: string | null
  email: string
  username: string | null
  customDomain: string | null
  isAdmin: boolean
  listed: boolean
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const method = data.id ? 'PUT' : 'POST'
  const url = data.id ? `${API_BASE}/admin/wayfarers/${data.id}` : `${API_BASE}/admin/wayfarers`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body.message ?? 'Failed to save' }
  }
  const body = await res.json()
  return { ok: true, id: body.data?.id }
}

export async function deleteWayfarer(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/wayfarers/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) return { ok: false, error: 'Failed to delete' }
  return { ok: true }
}

export async function bulkUpdateWayfarers(ids: string[], listed: boolean): Promise<void> {
  await fetch(`${API_BASE}/admin/wayfarers/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ ids, listed }),
  })
}

export async function bulkDeleteWayfarers(ids: string[]): Promise<void> {
  await fetch(`${API_BASE}/admin/wayfarers/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ ids }),
  })
}

export async function sendInvitation(data: {
  email: string
  note?: string
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body.message ?? 'Failed to send' }
  }
  return { ok: true }
}

export async function revokeInvitation(id: string): Promise<void> {
  await fetch(`${API_BASE}/admin/invitations/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}
