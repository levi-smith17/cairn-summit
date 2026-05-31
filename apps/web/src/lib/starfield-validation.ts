import type { SfOutpost, SfOutpostResource, SfOutpostSupply, SfResource } from '@cairn/types'
import {
  type OutpostWithId,
  enrichSupplyLine,
  getSupplyLines,
  normalizeOutpostResource,
  resolveSourceOutpostId,
} from './starfield-utils'

export type ValidationStatus = 'satisfied' | 'partial' | 'missing'

export interface ResourceValidation {
  resourceId: string
  status: ValidationStatus
  missingIngredients: string[]
}

export interface OutpostValidation {
  outpostId: string
  status: ValidationStatus
  resources: Map<string, ResourceValidation>
}

function worstStatus(a: ValidationStatus, b: ValidationStatus): ValidationStatus {
  const order: ValidationStatus[] = ['satisfied', 'partial', 'missing']
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? 'missing'
}

// visited: "outpostId:resourceId" pairs to prevent cross-outpost cycles
function validateResourceAtOutpost(
  resourceId: string,
  outpostId: string,
  outpostResourceMaps: Map<string, Map<string, SfOutpostResource>>,
  resourceDefMap: Map<string, SfResource>,
  outposts: OutpostWithId[],
  visited: Set<string>
): ResourceValidation {
  const visitKey = `${outpostId}:${resourceId}`
  if (visited.has(visitKey)) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  const outpostResourceMap = outpostResourceMaps.get(outpostId)
  if (!outpostResourceMap) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  const fr = outpostResourceMap.get(resourceId)
  if (!fr) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  const def = resourceDefMap.get(resourceId)
  const isMined = def ? (def.mined === true || def.tier === 0) : false
  const nextVisited = new Set(visited)
  nextVisited.add(visitKey)

  if (fr.onsite) {
    if (isMined || !def?.ingredients?.length) {
      return { resourceId, status: 'satisfied', missingIngredients: [] }
    }
    const missingIngredients: string[] = []
    for (const ingredientId of def.ingredients) {
      const child = validateResourceAtOutpost(
        ingredientId,
        outpostId,
        outpostResourceMaps,
        resourceDefMap,
        outposts,
        nextVisited
      )
      if (child.status === 'missing' || child.status === 'partial') {
        missingIngredients.push(...child.missingIngredients)
      }
    }
    let status: ValidationStatus
    if (missingIngredients.length === 0) status = 'satisfied'
    else if (missingIngredients.length < def.ingredients.length) status = 'partial'
    else status = 'missing'
    return { resourceId, status, missingIngredients }
  }

  if (fr.origin) {
    return { resourceId, status: 'satisfied', missingIngredients: [] }
  }

  const supplies = getSupplyLines(fr)
  if (supplies.length === 0) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  let aggregate: ValidationStatus = 'missing'
  const allMissing: string[] = []

  for (const rawSupply of supplies) {
    const supply = enrichSupplyLine(rawSupply, outposts)
    const lineStatus = validateIncomingSupplyLine(
      resourceId,
      supply,
      outpostResourceMaps,
      resourceDefMap,
      outposts,
      nextVisited
    )
    aggregate = worstStatus(aggregate, lineStatus.status)
    if (lineStatus.status !== 'satisfied') {
      allMissing.push(...lineStatus.missingIngredients)
    }
  }

  return { resourceId, status: aggregate, missingIngredients: allMissing }
}

function validateIncomingSupplyLine(
  resourceId: string,
  supply: SfOutpostSupply,
  outpostResourceMaps: Map<string, Map<string, SfOutpostResource>>,
  resourceDefMap: Map<string, SfResource>,
  outposts: OutpostWithId[],
  visited: Set<string>
): ResourceValidation {
  const sourceOutpostId = resolveSourceOutpostId(supply, outposts)
  if (!sourceOutpostId) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }
  return validateResourceAtOutpost(
    resourceId,
    sourceOutpostId,
    outpostResourceMaps,
    resourceDefMap,
    outposts,
    visited
  )
}

export function validateNetwork(
  outposts: (SfOutpost & { id: string })[],
  resources: SfResource[]
): Map<string, OutpostValidation> {
  const resourceDefMap = new Map<string, SfResource>()
  for (const r of resources) {
    const id = r.sk.replace(/^RESOURCE#/, '')
    resourceDefMap.set(id, r)
  }

  const outpostsWithId = outposts as OutpostWithId[]

  const outpostResourceMaps = new Map<string, Map<string, SfOutpostResource>>()
  for (const outpost of outpostsWithId) {
    const map = new Map<string, SfOutpostResource>()
    for (const fr of outpost.resources) {
      map.set(fr.resourceId, normalizeOutpostResource(fr))
    }
    outpostResourceMaps.set(outpost.id, map)
  }

  const result = new Map<string, OutpostValidation>()

  for (const outpost of outpostsWithId) {
    const resourceValidations = new Map<string, ResourceValidation>()

    for (const fr of outpost.resources) {
      const rv = validateResourceAtOutpost(
        fr.resourceId,
        outpost.id,
        outpostResourceMaps,
        resourceDefMap,
        outpostsWithId,
        new Set()
      )
      resourceValidations.set(fr.resourceId, rv)
    }

    let outpostStatus: ValidationStatus
    if (resourceValidations.size === 0) {
      outpostStatus = 'missing'
    } else {
      const statuses = Array.from(resourceValidations.values()).map(rv => rv.status)
      if (statuses.every(s => s === 'satisfied')) {
        outpostStatus = 'satisfied'
      } else if (statuses.some(s => s === 'satisfied' || s === 'partial')) {
        outpostStatus = 'partial'
      } else {
        outpostStatus = 'missing'
      }
    }

    result.set(outpost.id, {
      outpostId: outpost.id,
      status: outpostStatus,
      resources: resourceValidations,
    })
  }

  return result
}
