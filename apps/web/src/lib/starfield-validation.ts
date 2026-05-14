import type { SfFacility, SfResource } from '@cairn/types'

export type ValidationStatus = 'satisfied' | 'partial' | 'missing'

export interface ResourceValidation {
  resourceId: string
  status: ValidationStatus
  missingIngredients: string[]
}

export interface FacilityValidation {
  facilityId: string
  status: ValidationStatus
  resources: Map<string, ResourceValidation>
}

function stripResourcePrefix(sk: string): string {
  return sk.replace(/^RESOURCE#/, '')
}

function validateResource(
  resourceId: string,
  facilityResourceMap: Map<string, { onsite: boolean; fromFacilityId?: string }>,
  resourceDefMap: Map<string, SfResource>,
  visited: Set<string>
): ResourceValidation {
  if (visited.has(resourceId)) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  const fr = facilityResourceMap.get(resourceId)
  if (!fr) {
    return { resourceId, status: 'missing', missingIngredients: [resourceId] }
  }

  const def = resourceDefMap.get(resourceId)
  const isMined = def ? (def.mined === true || def.tier === 0) : false

  if (isMined) {
    const satisfied = fr.onsite === true || (!!fr.fromFacilityId && fr.fromFacilityId.length > 0)
    return {
      resourceId,
      status: satisfied ? 'satisfied' : 'missing',
      missingIngredients: satisfied ? [] : [resourceId],
    }
  }

  if (!def || !def.ingredients || def.ingredients.length === 0) {
    const satisfied = fr.onsite === true || (!!fr.fromFacilityId && fr.fromFacilityId.length > 0)
    return {
      resourceId,
      status: satisfied ? 'satisfied' : 'missing',
      missingIngredients: satisfied ? [] : [resourceId],
    }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(resourceId)

  const missingIngredients: string[] = []
  for (const ingredientId of def.ingredients) {
    const child = validateResource(ingredientId, facilityResourceMap, resourceDefMap, nextVisited)
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
  facilities: SfFacility[],
  resources: SfResource[]
): Map<string, FacilityValidation> {
  const resourceDefMap = new Map<string, SfResource>()
  for (const r of resources) {
    const id = stripResourcePrefix(r.sk)
    resourceDefMap.set(id, r)
  }

  const result = new Map<string, FacilityValidation>()

  for (const facility of facilities) {
    const facilityId = facility.sk.replace(/^SF#FACILITY#/, '')

    const facilityResourceMap = new Map<string, { onsite: boolean; fromFacilityId?: string }>()
    for (const fr of facility.resources) {
      facilityResourceMap.set(fr.resourceId, { onsite: fr.onsite, fromFacilityId: fr.fromFacilityId })
    }

    const resourceValidations = new Map<string, ResourceValidation>()
    for (const fr of facility.resources) {
      const rv = validateResource(fr.resourceId, facilityResourceMap, resourceDefMap, new Set())
      resourceValidations.set(fr.resourceId, rv)
    }

    let facilityStatus: ValidationStatus
    if (resourceValidations.size === 0) {
      facilityStatus = 'missing'
    } else {
      const statuses = Array.from(resourceValidations.values()).map(rv => rv.status)
      if (statuses.every(s => s === 'satisfied')) {
        facilityStatus = 'satisfied'
      } else if (statuses.some(s => s === 'satisfied' || s === 'partial')) {
        facilityStatus = 'partial'
      } else {
        facilityStatus = 'missing'
      }
    }

    result.set(facilityId, {
      facilityId,
      status: facilityStatus,
      resources: resourceValidations,
    })
  }

  return result
}
