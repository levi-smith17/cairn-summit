import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL

export async function getSupplylines(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/supplylines`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch supplylines')
  const data = await res.json()
  return data.data ?? []
}

export async function saveSupplyline(data: Record<string, any>): Promise<any> {
  const { id, ...rest } = data
  const url = id ? `${API_BASE}/supplylines/${id}` : `${API_BASE}/supplylines`
  const res = await fetch(url, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(rest),
  })
  if (!res.ok) throw new Error('Failed to save supplyline')
  return res.json()
}

export async function deleteSupplyline(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/supplylines/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete supplyline')
}

export async function toggleSupplylineActive(id: string, active: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/supplylines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ active }),
  })
  if (!res.ok) throw new Error('Failed to toggle supplyline')
  return res.json()
}

export async function getBurn(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/burn`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch burn')
  const data = await res.json()
  return data.data ?? []
}

export async function saveBurn(data: Record<string, any>): Promise<any> {
  const { id, ...rest } = data
  const url = id ? `${API_BASE}/burn/${id}` : `${API_BASE}/burn`
  const res = await fetch(url, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(rest),
  })
  if (!res.ok) throw new Error('Failed to save burn item')
  return res.json()
}

export async function deleteBurn(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/burn/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete burn item')
}

export async function getCache(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cache`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch cache')
  const data = await res.json()
  return data.data ?? []
}

export async function saveCache(data: Record<string, any>): Promise<any> {
  const { id, ...rest } = data
  const url = id ? `${API_BASE}/cache/${id}` : `${API_BASE}/cache`
  const res = await fetch(url, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(rest),
  })
  if (!res.ok) throw new Error('Failed to save cache')
  return res.json()
}

export async function deleteCache(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cache/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete cache')
}

export async function carryOverCache(data: { month: number; year: number }): Promise<void> {
  await fetch(`${API_BASE}/cache/carry-over`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
}

export async function getSupplylinesSummary(month: number, year: number): Promise<any> {
  const res = await fetch(`${API_BASE}/supplylines/summary?month=${month}&year=${year}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch summary')
  const json = await res.json()
  return json.data
}
