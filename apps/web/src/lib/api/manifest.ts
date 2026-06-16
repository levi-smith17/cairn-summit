import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const CLOUDFRONT_PUBLIC_MEDIA_URL = import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL ?? ''

export function publicMediaUrl(key: string): string {
  return `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${key}`
}

export async function getManifestData() {
  const res = await fetch(`${API_BASE}/manifest`, {
    headers: await getAuthHeaders(),
  })
  const json = await res.json()
  return json.data ?? json
}

export async function saveOrigins(data: {
  headline: string | null
  summary: string | null
  bio: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
}) {
  await fetch(`${API_BASE}/manifest/origins`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
  })
}

export async function saveExpedition(data: {
  id?: string
  title: string
  company: string
  location: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/expeditions/${id}` : `${API_BASE}/manifest/expeditions`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deleteExpedition(id: string) {
  await fetch(`${API_BASE}/manifest/expeditions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function saveTraining(data: {
  id?: string
  institution: string
  degree: string | null
  field: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/training/${id}` : `${API_BASE}/manifest/training`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deleteTraining(id: string) {
  await fetch(`${API_BASE}/manifest/training/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function saveGear(data: {
  id?: string
  name: string
  category: string | null
  level: string | null
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/gear/${id}` : `${API_BASE}/manifest/gear`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deleteGear(id: string) {
  await fetch(`${API_BASE}/manifest/gear/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function saveLandmark(data: {
  id?: string
  name: string
  description: string | null
  url: string | null
  githubUrl: string | null
  startDate: Date | null
  endDate: Date | null
  current: boolean
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/landmarks/${id}` : `${API_BASE}/manifest/landmarks`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deleteLandmark(id: string) {
  await fetch(`${API_BASE}/manifest/landmarks/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function saveSummit(data: {
  id?: string
  title: string
  issuer: string | null
  date: Date | null
  description: string | null
  url: string | null
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/summits/${id}` : `${API_BASE}/manifest/summits`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deleteSummit(id: string) {
  await fetch(`${API_BASE}/manifest/summits/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function savePathfinding(data: {
  id?: string
  organization: string
  role: string | null
  location: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/pathfinding/${id}` : `${API_BASE}/manifest/pathfinding`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deletePathfinding(id: string) {
  await fetch(`${API_BASE}/manifest/pathfinding/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function saveCompanion(data: {
  id?: string
  name: string
  species: string
  breed: string | null
  birthday: Date | null
  bio: string | null
  passed: boolean
}) {
  const { id, ...payload } = data
  await fetch(id ? `${API_BASE}/manifest/companions/${id}` : `${API_BASE}/manifest/companions`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
}

export async function deleteCompanion(id: string) {
  await fetch(`${API_BASE}/manifest/companions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function uploadCompanionMedia(file: File, companionId: string, order: number): Promise<{ key: string; mediaId: string; type: string }> {
  const res = await fetch(`${API_BASE}/companions/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ companionId, contentType: file.type, fileSize: file.size, order }),
  })
  if (!res.ok) throw new Error('Failed to get upload URL')
  const { data } = await res.json()
  await fetch(data.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  return { key: data.key, mediaId: data.mediaId, type: data.type }
}

export async function deleteCompanionMedia(mediaId: string) {
  await fetch(`${API_BASE}/manifest/companions/media/${mediaId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}

export async function updateCompanionMediaCaption(mediaId: string, caption: string | null) {
  await fetch(`${API_BASE}/manifest/companions/media/${mediaId}/caption`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify({ caption }),
  })
}

export async function deleteAccount() {
  await fetch(`${API_BASE}/manifest/account`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}
