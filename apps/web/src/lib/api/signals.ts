import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export interface SignalReply {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  senderEmail?: string | null
  createdAt: string
}

export interface Signal {
  id: string
  senderName: string
  senderEmail: string
  body: string
  read: boolean
  createdAt: string
  replies: SignalReply[]
}

export interface SignalSettingsValues {
  messagesPerPage: number
  autoMarkRead: boolean
  autoRefreshInterval: number
  compactView: boolean
  showSnippets: boolean
  browserNotifications: boolean
  notificationSound: boolean
}

export async function getSignals(): Promise<Signal[]> {
  const res = await fetch(`${API_BASE}/signals`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch signals')
  const json = await res.json()
  return json.data ?? []
}

export async function replyToSignal(id: string, body: string): Promise<SignalReply> {
  const res = await fetch(`${API_BASE}/signals/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ body }),
  })
  if (!res.ok) throw new Error('Failed to send reply')
  const json = await res.json()
  return json.data
}

export async function markSignalRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/signals/${id}/read`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to mark signal read')
}

export async function deleteSignal(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/signals/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete signal')
}

export async function updateSignalSettings(data: SignalSettingsValues): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/signals`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update signal settings')
}
