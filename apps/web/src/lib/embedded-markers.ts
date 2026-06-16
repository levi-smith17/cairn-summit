export interface DisplayMarker {
  id: string
  name: string
  color: string
  icon?: string | null
}

/** DynamoDB EmbeddedMarker or legacy Prisma junction `{ markerId, marker }` */
export function toDisplayMarker(entry: unknown): DisplayMarker | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  if (e.marker && typeof e.marker === 'object') {
    const m = e.marker as DisplayMarker
    return typeof m.id === 'string' ? m : null
  }
  if (typeof e.id === 'string' && typeof e.name === 'string' && typeof e.color === 'string') {
    return { id: e.id, name: e.name, color: e.color, icon: e.icon as string | null | undefined }
  }
  return null
}

export function toMarkerId(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  if (typeof e.markerId === 'string') return e.markerId
  return toDisplayMarker(entry)?.id ?? null
}

export function markerDisplayName(entry: unknown): string | null {
  return toDisplayMarker(entry)?.name ?? null
}
