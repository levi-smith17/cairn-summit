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

export function resolveSourceOutpostId(
  supply: SfOutpostSupply,
  outposts: OutpostWithId[]
): string | null {
  if (supply.fromOutpostId) return supply.fromOutpostId
  if (supply.fromPlanet && supply.fromSystem) {
    const match = outposts.find(
      o => o.planet === supply.fromPlanet && o.system === supply.fromSystem
    )
    return match?.id ?? null
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
    if (fr.onsite || fr.origin) continue
    const lines = getSupplyLines(fr).filter(isIncomingSupplyLine)
    inboundCount += lines.length
  }

  let outboundCount = 0
  for (const o of outposts) {
    if (o.id === outpost.id) continue
    for (const fr of o.resources ?? []) {
      if (fr.onsite || fr.origin) continue
      for (const s of getSupplyLines(fr)) {
        if (!isIncomingSupplyLine(s)) continue
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
      if (fr.onsite || fr.origin) continue
      for (const s of getSupplyLines(fr)) {
        if (resolveSourceOutpostId(s, outposts) === outpostId) {
          ids.add(fr.resourceId)
        }
      }
    }
  }
  return ids
}
