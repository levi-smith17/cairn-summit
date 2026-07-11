import { markerDisplayName, toMarkerId } from '@/lib/embedded-markers'
import { markerShortLabel } from '@/lib/utils'
import type { Burn } from '@/routes/provisions/burn-row'
import type { BudgetUtilization } from '@/routes/provisions/cache-row'

export function cacheUtilizationColor(pct: number) {
  if (pct >= 100) return 'bg-destructive'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-primary'
}

export function burnMarkerKey(burn: Burn): string {
  return toMarkerId(burn.markers[0]) ?? 'uncategorized'
}

export function canvasMarkerLabel(
  markerId: string,
  markers: { id: string; name: string }[],
  cache?: BudgetUtilization,
): string {
  if (markerId === 'uncategorized') return 'Uncategorized'
  const name =
    markers.find((m) => m.id === markerId)?.name ??
    cache?.marker?.name ??
    markerDisplayName(cache?.marker)
  return markerShortLabel(name)
}

export function groupBurnsByMarker(burns: Burn[]) {
  const groups = new Map<string, Burn[]>()
  for (const burn of burns) {
    const key = burnMarkerKey(burn)
    const list = groups.get(key) ?? []
    list.push(burn)
    groups.set(key, list)
  }
  return groups
}

export type BurnCanvasGroup = {
  markerId: string
  burns: Burn[]
  cache?: BudgetUtilization
}

export function buildBurnCanvasGroups(
  burns: Burn[],
  cacheUtilization: BudgetUtilization[],
  markers: { id: string; name: string }[] = [],
): BurnCanvasGroup[] {
  const burnGroups = groupBurnsByMarker(burns)
  const markerIds = new Set<string>()
  for (const entry of cacheUtilization) markerIds.add(entry.markerId)
  for (const markerId of burnGroups.keys()) markerIds.add(markerId)

  return [...markerIds]
    .sort((a, b) =>
      canvasMarkerLabel(
        a,
        markers,
        cacheUtilization.find((entry) => entry.markerId === a),
      ).localeCompare(
        canvasMarkerLabel(
          b,
          markers,
          cacheUtilization.find((entry) => entry.markerId === b),
        ),
        undefined,
        { sensitivity: 'base' },
      ),
    )
    .map((markerId) => ({
      markerId,
      burns: [...(burnGroups.get(markerId) ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
      cache: cacheUtilization.find((entry) => entry.markerId === markerId),
    }))
}
