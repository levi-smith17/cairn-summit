import { getAuthHeaders } from './auth-headers'
import type { Kin, Bloodline } from '@cairn/types'

const API_URL = import.meta.env.VITE_API_URL ?? ''

export interface KinPayload {
  givenName: string
  middleName?: string
  nickname?: string
  surname: string
  isSelf?: boolean
  birthDate?: string
  deathDate?: string
  fatherId?: string
  fatherUnknown: boolean
  motherId?: string
  motherUnknown: boolean
  bloodlines: Bloodline[]
}

export async function getKin(): Promise<Kin[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/headwaters/kin`, { headers })
  if (!res.ok) throw new Error('Failed to fetch kin')
  const json = await res.json()
  return json.data ?? []
}

export async function createKin(payload: KinPayload): Promise<Kin> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/headwaters/kin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create kin')
  const json = await res.json()
  return json.data
}

export async function updateKin(id: string, payload: Partial<KinPayload>): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/headwaters/kin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update kin')
}

export async function deleteKin(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/headwaters/kin/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to delete kin')
}
