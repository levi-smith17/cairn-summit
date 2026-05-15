import type { SfOutpost, SfOutpostResource, SfResource } from '@cairn/types'

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

// visited: "outpostId:resourceId" pairs to prevent cross-outpost cycles
function validateResource(
  resourceId: string,
  outpostId: string,
  outpostResourceMaps: Map<string, Map<string, SfOutpostResource>>,
  resourceDefMap: Map<string, SfResource>,
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

  // Sourced from another outpost — validate it is actually satisfied there
  if (fr.fromOutpostId) {
    const nextVisited = new Set(visited)
    nextVisited.add(visitKey)
    return validateResource(resourceId, fr.fromOutpostId, outpostResourceMaps, resourceDefMap, nextVisited)
  }

  const def = resourceDefMap.get(resourceId)
  const isMined = def ? (def.mined === true || def.tier === 0) : false

  // Mined or no ingredients: satisfied only if produced onsite
  if (isMined || !def?.ingredients?.length) {
    return {
      resourceId,
      status: fr.onsite ? 'satisfied' : 'missing',
      missingIngredients: fr.onsite ? [] : [resourceId],
    }
  }

  // Manufactured with ingredients: must be marked onsite; ingredients checked within same outpost
  if (!fr.onsite) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(visitKey)

  const missingIngredients: string[] = []
  for (const ingredientId of def.ingredients) {
    const child = validateResource(ingredientId, outpostId, outpostResourceMaps, resourceDefMap, nextVisited)
    if (child.status === 'missing' || child.status === 'partial') {
      missingIngredients.push(...child.missingIngredients)
    }
  }

  let status: ValidationStatus
  if (missingIngredients.length === 0) {
    status = 'satisfied'
  } else if (missingIngredients.length < def.ingredients.length) {
    status = 'partial'
  } else {
    status = 'missing'
  }

  return { resourceId, status, missingIngredients }
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

  // Build a flat map: outpostId → Map<resourceId, outpostResource>
  const outpostResourceMaps = new Map<string, Map<string, SfOutpostResource>>()
  for (const outpost of outposts) {
    const map = new Map<string, SfOutpostResource>()
    for (const fr of outpost.resources) {
      map.set(fr.resourceId, fr)
    }
    outpostResourceMaps.set(outpost.id, map)
  }

  const result = new Map<string, OutpostValidation>()

  for (const outpost of outposts) {
    const resourceValidations = new Map<string, ResourceValidation>()

    for (const fr of outpost.resources) {
      const rv = validateResource(
        fr.resourceId,
        outpost.id,
        outpostResourceMaps,
        resourceDefMap,
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
