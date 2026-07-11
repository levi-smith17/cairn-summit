import { getAuthHeaders } from '@/lib/api/auth-headers'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const CLOUDFRONT_PUBLIC_MEDIA_URL = import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL ?? ''

export function publicMediaUrl(key: string): string {
  return `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${key}`
}

export type ManifestOrigins = {
  headline: string | null
  summary: string | null
  bio: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
}

export type ManifestExpedition = {
  id: string
  title: string
  company: string
  location: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

export type ManifestTraining = {
  id: string
  institution: string
  degree: string | null
  field: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

export type ManifestGear = {
  id: string
  name: string
  category: string | null
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null
}

export type ManifestLandmark = {
  id: string
  name: string
  description: string | null
  url: string | null
  githubUrl: string | null
  startDate: string | null
  endDate: string | null
  current: boolean
}

export type ManifestSummit = {
  id: string
  title: string
  issuer: string | null
  date: string | null
  description: string | null
  url: string | null
}

export type ManifestPathfinding = {
  id: string
  organization: string
  role: string | null
  location: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

export type ManifestCompanion = {
  id: string
  name: string
  species: string
  breed?: string | null
  birthday?: string | null
  bio?: string | null
  passed?: boolean
  media: Array<{
    id: string
    key: string
    type: 'IMAGE' | 'VIDEO'
    caption?: string | null
    order: number
  }>
}

export type ManifestData = {
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
  username: string | null
  origins: ManifestOrigins | null
  expeditions: ManifestExpedition[]
  training: ManifestTraining[]
  gear: ManifestGear[]
  landmarks: ManifestLandmark[]
  summits: ManifestSummit[]
  pathfinding: ManifestPathfinding[]
  companions: ManifestCompanion[]
}

function toIso(value: string | Date | null | undefined): string | null {
  if (value == null || value === '') return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function toIsoRequired(value: string | Date): string {
  return toIso(value) ?? new Date().toISOString()
}

export async function getManifestData(): Promise<ManifestData> {
  const res = await fetch(`${API_BASE}/manifest`, {
    headers: await getAuthHeaders(),
  })
  const json = await res.json()
  return json.data ?? json
}

export async function saveOrigins(data: ManifestOrigins) {
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
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string | null
}) {
  const { id, startDate, endDate, ...rest } = data
  const payload = {
    ...rest,
    startDate: toIsoRequired(startDate),
    endDate: toIso(endDate),
  }
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
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string | null
}) {
  const { id, startDate, endDate, ...rest } = data
  const payload = {
    ...rest,
    startDate: toIsoRequired(startDate),
    endDate: toIso(endDate),
  }
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
  startDate: string | Date | null
  endDate: string | Date | null
  current: boolean
}) {
  const { id, startDate, endDate, ...rest } = data
  const payload = {
    ...rest,
    startDate: toIso(startDate),
    endDate: toIso(endDate),
  }
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
  date: string | Date | null
  description: string | null
  url: string | null
}) {
  const { id, date, ...rest } = data
  const payload = { ...rest, date: toIso(date) }
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
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string | null
}) {
  const { id, startDate, endDate, ...rest } = data
  const payload = {
    ...rest,
    startDate: toIsoRequired(startDate),
    endDate: toIso(endDate),
  }
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
  birthday: string | Date | null
  bio: string | null
  passed: boolean
}) {
  const { id, birthday, ...rest } = data
  const payload = { ...rest, birthday: toIso(birthday) }
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
