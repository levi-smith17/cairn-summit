import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Backpack,
  Briefcase,
  Compass,
  Flag,
  GraduationCap,
  MapPin,
  PawPrint,
  ScrollText,
} from 'lucide-react'
import type { Terms } from '@/lib/terminology'
import type { ManifestData } from '@/lib/api/manifest'

export type ManifestSectionId =
  | 'origins'
  | 'expeditions'
  | 'training'
  | 'gear'
  | 'landmarks'
  | 'summits'
  | 'pathfinding'

export type ManifestJourneySectionId = 'bio' | 'companions' | 'in-memoriam'

export type ManifestCanvasView = 'manifest' | 'journey'

export type ManifestSection = {
  id: ManifestSectionId
  label: string
  icon: LucideIcon
  count: number | null
}

export type ManifestJourneySection = {
  id: ManifestJourneySectionId
  label: string
  icon: LucideIcon
  count: number | null
}

const SECTION_META: Array<{ id: ManifestSectionId; icon: LucideIcon; termKey: keyof Terms }> = [
  { id: 'origins', icon: MapPin, termKey: 'origins' },
  { id: 'expeditions', icon: Briefcase, termKey: 'expeditions' },
  { id: 'training', icon: GraduationCap, termKey: 'training' },
  { id: 'gear', icon: Backpack, termKey: 'gear' },
  { id: 'landmarks', icon: Flag, termKey: 'landmarks' },
  { id: 'summits', icon: Award, termKey: 'summits' },
  { id: 'pathfinding', icon: Compass, termKey: 'pathfinding' },
]

export function manifestSectionCounts(data: ManifestData): Record<ManifestSectionId, number | null> {
  return {
    origins: null,
    expeditions: data.expeditions.length,
    training: data.training.length,
    gear: data.gear.length,
    landmarks: data.landmarks.length,
    summits: data.summits.length,
    pathfinding: data.pathfinding.length,
  }
}

export function buildManifestSections(data: ManifestData, terms: Terms): ManifestSection[] {
  const counts = manifestSectionCounts(data)
  return SECTION_META.map((section) => ({
    id: section.id,
    icon: section.icon,
    label: terms[section.termKey] as string,
    count: counts[section.id],
  }))
}

export function buildJourneySections(data: ManifestData, terms: Terms): ManifestJourneySection[] {
  const active = data.companions.filter((companion) => !companion.passed)
  const passed = data.companions.filter((companion) => companion.passed)
  return [
    { id: 'bio', label: terms.bio, icon: ScrollText, count: null },
    { id: 'companions', label: terms.companions, icon: PawPrint, count: active.length || null },
    {
      id: 'in-memoriam',
      label: terms.summit_reached,
      icon: Award,
      count: passed.length || null,
    },
  ]
}

export function formatManifestMonth(date: string | Date | null | undefined): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function formatManifestDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatCompanionAge(birthday: string | Date | null | undefined): string | null {
  if (!birthday) return null
  const born = new Date(birthday)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let years = now.getUTCFullYear() - born.getUTCFullYear()
  const monthDelta = now.getUTCMonth() - born.getUTCMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < born.getUTCDate())) years -= 1
  if (years < 0) return null
  return years === 1 ? '1 year old' : `${years} years old`
}

export function formatManifestDateRange(
  startDate: string,
  endDate: string | null,
  current: boolean,
): string {
  const start = formatManifestMonth(startDate)
  const end = current ? 'Present' : endDate ? formatManifestMonth(endDate) : ''
  return `${start} — ${end}`
}
