import { toast } from 'sonner'
import type {
  ManifestCompanion,
  ManifestData,
  ManifestExpedition,
  ManifestLandmark,
  ManifestPathfinding,
} from '@/lib/api/manifest'
import {
  saveCompanion,
  saveExpedition,
  saveLandmark,
  savePathfinding,
} from '@/lib/api/manifest'

type PendingSave = {
  timer: number
  save: () => Promise<void>
  toastMessage: string | false
}

const pendingSaves = new Map<string, PendingSave>()

async function runPendingSave(
  key: string,
  save: () => Promise<void>,
  toastMessage: string | false,
) {
  try {
    await save()
    if (toastMessage) toast.success(toastMessage)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to save manifest entry')
  } finally {
    pendingSaves.delete(key)
  }
}

function scheduleSave(key: string, save: () => Promise<void>, toastMessage: string | false = 'Saved') {
  const existing = pendingSaves.get(key)
  if (existing) window.clearTimeout(existing.timer)
  const timer = window.setTimeout(() => {
    void runPendingSave(key, save, toastMessage)
  }, 700)
  pendingSaves.set(key, { timer, save, toastMessage })
}

export async function flushAllManifestPatchSaves(): Promise<void> {
  const entries = [...pendingSaves.entries()]
  await Promise.all(
    entries.map(async ([key, pending]) => {
      window.clearTimeout(pending.timer)
      pendingSaves.delete(key)
      await runPendingSave(key, pending.save, false)
    }),
  )
}

function draftIdSave(id: string) {
  return id.startsWith('draft-') ? undefined : id
}

export function patchManifestExpedition(
  setDraft: React.Dispatch<React.SetStateAction<ManifestData | null>>,
  id: string,
  patch: Partial<ManifestExpedition>,
) {
  setDraft((prev) => {
    if (!prev) return prev
    const expeditions = prev.expeditions.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    )
    const updated = expeditions.find((item) => item.id === id)
    if (updated && updated.title.trim() && updated.company.trim() && updated.startDate) {
      scheduleSave(`expedition:${id}`, () =>
        saveExpedition({
          id: draftIdSave(id),
          title: updated.title.trim(),
          company: updated.company.trim(),
          location: updated.location,
          startDate: updated.startDate,
          endDate: updated.endDate,
          current: updated.current,
          description: updated.description,
        }),
      )
    }
    return { ...prev, expeditions }
  })
}

export function patchManifestLandmark(
  setDraft: React.Dispatch<React.SetStateAction<ManifestData | null>>,
  id: string,
  patch: Partial<ManifestLandmark>,
) {
  setDraft((prev) => {
    if (!prev) return prev
    const landmarks = prev.landmarks.map((item) => (item.id === id ? { ...item, ...patch } : item))
    const updated = landmarks.find((item) => item.id === id)
    if (updated && updated.name.trim()) {
      scheduleSave(`landmark:${id}`, () =>
        saveLandmark({
          id: draftIdSave(id),
          name: updated.name.trim(),
          description: updated.description,
          url: updated.url,
          githubUrl: updated.githubUrl,
          startDate: updated.startDate,
          endDate: updated.endDate,
          current: updated.current,
        }),
      )
    }
    return { ...prev, landmarks }
  })
}

export function patchManifestPathfinding(
  setDraft: React.Dispatch<React.SetStateAction<ManifestData | null>>,
  id: string,
  patch: Partial<ManifestPathfinding>,
) {
  setDraft((prev) => {
    if (!prev) return prev
    const pathfinding = prev.pathfinding.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    )
    const updated = pathfinding.find((item) => item.id === id)
    if (updated && updated.organization.trim() && updated.startDate) {
      scheduleSave(`pathfinding:${id}`, () =>
        savePathfinding({
          id: draftIdSave(id),
          organization: updated.organization.trim(),
          role: updated.role,
          location: updated.location,
          startDate: updated.startDate,
          endDate: updated.endDate,
          current: updated.current,
          description: updated.description,
        }),
      )
    }
    return { ...prev, pathfinding }
  })
}

export function patchManifestCompanion(
  setDraft: React.Dispatch<React.SetStateAction<ManifestData | null>>,
  id: string,
  patch: Partial<ManifestCompanion>,
) {
  setDraft((prev) => {
    if (!prev) return prev
    const companions = prev.companions.map((item) => (item.id === id ? { ...item, ...patch } : item))
    const updated = companions.find((item) => item.id === id)
    if (updated && updated.name.trim() && updated.species.trim()) {
      scheduleSave(`companion:${id}`, () =>
        saveCompanion({
          id: draftIdSave(id),
          name: updated.name.trim(),
          species: updated.species.trim(),
          breed: updated.breed ?? null,
          birthday: updated.birthday ?? null,
          bio: updated.bio ?? null,
          passed: updated.passed ?? false,
        }),
      )
    }
    return { ...prev, companions }
  })
}
