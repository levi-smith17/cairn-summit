export type ParsedStone = {
  face: string
  core: string
  markerNames: string[] // resolved to IDs during import
}

export type ParseResult =
  | { ok: true; stones: ParsedStone[] }
  | { ok: false; error: string }

// ── JSON ──────────────────────────────────────────────────────────────────────

export function parseJsonImport(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Invalid JSON — could not parse file.' }
  }

  if (typeof data !== 'object' || data === null || !('stones' in data)) {
    return { ok: false, error: 'JSON must have a top-level "stones" array.' }
  }

  const raw = (data as { stones: unknown }).stones
  if (!Array.isArray(raw)) {
    return { ok: false, error: '"stones" must be an array.' }
  }

  const stones: ParsedStone[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: `Stone at index ${i} is not an object.` }
    }
    const obj = item as Record<string, unknown>
    if (typeof obj.face !== 'string' || !obj.face.trim()) {
      return { ok: false, error: `Stone at index ${i} is missing a "face" string.` }
    }
    if (typeof obj.core !== 'string' || !obj.core.trim()) {
      return { ok: false, error: `Stone at index ${i} is missing a "core" string.` }
    }
    const markerNames: string[] = []
    if (Array.isArray(obj.markers)) {
      for (const m of obj.markers) {
        if (typeof m === 'string' && m.trim()) markerNames.push(m.trim())
      }
    }
    stones.push({ face: obj.face.trim(), core: obj.core.trim(), markerNames })
  }

  if (stones.length === 0) {
    return { ok: false, error: 'No stones found in file.' }
  }

  return { ok: true, stones }
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields.map(f => f.trim())
}

export function parseCsvImport(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { ok: false, error: 'File is empty.' }

  const firstFields = parseCsvLine(lines[0])
  const hasHeader =
    firstFields[0].toLowerCase() === 'face' ||
    firstFields[0].toLowerCase() === 'prompt'

  const dataLines = hasHeader ? lines.slice(1) : lines

  if (dataLines.length === 0) {
    return { ok: false, error: 'No stones found after header row.' }
  }

  const stones: ParsedStone[] = []
  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCsvLine(dataLines[i])
    const face = fields[0] ?? ''
    const core = fields[1] ?? ''
    if (!face || !core) continue // skip blank rows

    const markerNames: string[] = []
    const markersRaw = fields[2] ?? ''
    if (markersRaw) {
      markersRaw.split('|').forEach(m => {
        const t = m.trim()
        if (t) markerNames.push(t)
      })
    }

    stones.push({ face, core, markerNames })
  }

  if (stones.length === 0) {
    return { ok: false, error: 'No valid stones found. Check that each row has a face and core column.' }
  }

  return { ok: true, stones }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function parseImportFile(text: string, filename: string): ParseResult {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'json') return parseJsonImport(text)
  if (ext === 'csv') return parseCsvImport(text)
  // Try JSON first, fall back to CSV
  const jsonResult = parseJsonImport(text)
  if (jsonResult.ok) return jsonResult
  return parseCsvImport(text)
}

// ── Marker resolution ─────────────────────────────────────────────────────────

export function resolveMarkerIds(
  markerNames: string[],
  available: { id: string; name: string }[]
): string[] {
  return markerNames
    .map(name => available.find(m => m.name.toLowerCase() === name.toLowerCase())?.id)
    .filter((id): id is string => id !== undefined)
}
