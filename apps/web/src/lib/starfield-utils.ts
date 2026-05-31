import type { SfOutpost, SfOutpostResource, SfOutpostSupply } from '@cairn/types'

export type OutpostWithId = SfOutpost & { id: string }

/** Normalize legacy flat fromPlanet/relay into supplies[]. */
export function normalizeOutpostResource(fr: SfOutpostResource): SfOutpostResource {
  if (fr.supplies?.length) return fr
  if (fr.fromPlanet || fr.fromOutpostId) {
    return {
      ...fr,
      supplies: [{
        fromOutpostId: fr.fromOutpostId ?? null,
        fromPlanet: fr.fromPlanet ?? null,
        fromSystem: fr.fromSystem ?? null,
        relay: fr.relay ?? null,
      }],
    }
  }
  return { ...fr, supplies: [] }
}

export function getSupplyLines(fr: SfOutpostResource): SfOutpostSupply[] {
  const normalized = normalizeOutpostResource(fr)
  return normalized.supplies ?? []
}

/** Fill fromPlanet/fromSystem from fromOutpostId when only the id was persisted. */
export function enrichSupplyLine(
  supply: SfOutpostSupply,
  outposts: OutpostWithId[]
): SfOutpostSupply {
  if (supply.fromPlanet && supply.fromSystem) return supply
  if (supply.fromOutpostId) {
    const src = outposts.find(o => o.id === supply.fromOutpostId)
    if (src) {
      return {
        ...supply,
        fromPlanet: supply.fromPlanet ?? src.planet,
        fromSystem: supply.fromSystem ?? src.system,
      }
    }
  }
  return supply
}

export function getEnrichedSupplyLines(
  fr: SfOutpostResource,
  outposts: OutpostWithId[]
): SfOutpostSupply[] {
  return getSupplyLines(fr).map(s => enrichSupplyLine(s, outposts))
}

function norm(s: string | null | undefined): string {
  return (s ?? '').trim()
}

export function getIncomingSupplyLines(
  fr: SfOutpostResource,
  outposts: OutpostWithId[]
): SfOutpostSupply[] {
  return getSupplyLines(fr)
    .map(s => enrichSupplyLine(s, outposts))
    .filter(isIncomingSupplyLine)
}

export function resolveSourceOutpostId(
  supply: SfOutpostSupply,
  outposts: OutpostWithId[]
): string | null {
  const s = enrichSupplyLine(supply, outposts)
  const planet = norm(s.fromPlanet)
  const system = norm(s.fromSystem)

  if (planet && system) {
    const match = outposts.find(
      o => norm(o.planet) === planet && norm(o.system) === system
    )
    if (match) return match.id
  }

  if (s.fromOutpostId && outposts.some(o => o.id === s.fromOutpostId)) {
    return s.fromOutpostId
  }

  if (planet) {
    const matches = outposts.filter(o => norm(o.planet) === planet)
    if (matches.length === 1) return matches[0].id
  }

  return null
}

export function isIncomingSupplyLine(supply: SfOutpostSupply): boolean {
  return !!(supply.fromOutpostId || supply.fromPlanet)
}

export function countTransferStations(
  outpost: OutpostWithId,
  outposts: OutpostWithId[]
): number {
  let inboundCount = 0
  for (const fr of outpost.resources ?? []) {
    if (fr.onsite) continue
    const incomingLines = getIncomingSupplyLines(fr, outposts)
    if (fr.origin && incomingLines.length === 0) continue
    inboundCount += incomingLines.length
  }

  let outboundCount = 0
  for (const o of outposts) {
    if (o.id === outpost.id) continue
    for (const fr of o.resources ?? []) {
      if (fr.onsite) continue
      for (const s of getIncomingSupplyLines(fr, outposts)) {
        if (resolveSourceOutpostId(s, outposts) === outpost.id) outboundCount++
      }
    }
  }

  return inboundCount + outboundCount
}

/** Outposts whose resources reference this outpost as a source (for export arrows). */
export function getShippedOutResourceIds(
  outpostId: string,
  outposts: OutpostWithId[]
): Set<string> {
  const ids = new Set<string>()
  for (const o of outposts) {
    if (o.id === outpostId) continue
    for (const fr of o.resources ?? []) {
      if (fr.onsite) continue
      for (const s of getIncomingSupplyLines(fr, outposts)) {
        if (resolveSourceOutpostId(s, outposts) === outpostId) {
          ids.add(fr.resourceId)
        }
      }
    }
  }
  return ids
}
