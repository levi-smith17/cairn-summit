const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function getAuthHeaders(): Promise<Record<string, string>> {
  return {}
}

export async function getManifestData() {
  const res = await fetch(`${API_BASE}/manifest`, {
    headers: await getAuthHeaders(),
  })
  return res.json()
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
  await fetch(`${API_BASE}/manifest/expeditions`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
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
  await fetch(`${API_BASE}/manifest/training`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
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
  await fetch(`${API_BASE}/manifest/gear`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
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
  await fetch(`${API_BASE}/manifest/landmarks`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
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
  await fetch(`${API_BASE}/manifest/summits`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
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
  await fetch(`${API_BASE}/manifest/pathfinding`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
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
  await fetch(`${API_BASE}/manifest/companions`, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
  })
}

export async function deleteCompanion(id: string) {
  await fetch(`${API_BASE}/manifest/companions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
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

export async function saveManifestSettings(data: {
  username: string | null
  defaultTerminology: 'CAIRN' | 'STANDARD'
  defaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
  listed: boolean
  customDomain: string | null
}) {
  await fetch(`${API_BASE}/manifest/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(data),
  })
}

export async function deleteAccount() {
  await fetch(`${API_BASE}/manifest/account`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
}
