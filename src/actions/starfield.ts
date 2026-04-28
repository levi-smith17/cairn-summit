'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── Facilities ──────────────────────────────────────────────────────────────

export async function saveFacility({
  id,
  name,
  abbreviation,
  planetId,
}: {
  id?: string
  name: string
  abbreviation: string
  planetId: string
}) {
  if (id) {
    await prisma.sfFacility.update({
      where: { id },
      data: { name, abbreviation, planetId },
    })
  } else {
    await prisma.sfFacility.create({
      data: { name, abbreviation, planetId },
    })
  }
  revalidatePath('/starfield/facilities')
}

export async function deleteFacility(id: string) {
  await prisma.sfFacility.delete({ where: { id } })
  revalidatePath('/starfield/facilities')
}

// ─── Facility Resources ──────────────────────────────────────────────────────

export async function saveFacilityResource({
  id,
  facilityId,
  resourceId,
  planetId,
  subfacility1Id,
  subfacility2Id,
  subfacility3Id,
  relayId,
  onsite,
}: {
  id?: string
  facilityId: string
  resourceId: string
  planetId: string
  subfacility1Id?: string | null
  subfacility2Id?: string | null
  subfacility3Id?: string | null
  relayId?: string | null
  onsite: boolean
}) {
  const data = {
    facilityId,
    resourceId,
    planetId,
    subfacility1Id: subfacility1Id ?? null,
    subfacility2Id: subfacility2Id ?? null,
    subfacility3Id: subfacility3Id ?? null,
    relayId: relayId ?? null,
    onsite,
  }

  if (id) {
    await prisma.sfFacilityResource.update({ where: { id }, data })
  } else {
    await prisma.sfFacilityResource.create({ data })
  }

  revalidatePath('/starfield/facilities')
}

export async function deleteFacilityResource(id: string) {
  await prisma.sfFacilityResource.delete({ where: { id } })
  revalidatePath('/starfield/facilities')
}

// ─── Resource Catalog ────────────────────────────────────────────────────────

export async function saveResource({
  id,
  name,
  abbreviation,
  typeId,
  resource1Id,
  resource2Id,
  resource3Id,
  resource4Id,
}: {
  id?: string
  name: string
  abbreviation: string
  typeId: string
  resource1Id?: string | null
  resource2Id?: string | null
  resource3Id?: string | null
  resource4Id?: string | null
}) {
  const data = {
    name,
    abbreviation,
    typeId,
    resource1Id: resource1Id ?? null,
    resource2Id: resource2Id ?? null,
    resource3Id: resource3Id ?? null,
    resource4Id: resource4Id ?? null,
  }

  if (id) {
    await prisma.sfResource.update({ where: { id }, data })
  } else {
    await prisma.sfResource.create({ data })
  }

  revalidatePath('/starfield')
  revalidatePath('/starfield/resources')
}

export async function deleteResource(id: string) {
  await prisma.sfResource.delete({ where: { id } })
  revalidatePath('/starfield')
  revalidatePath('/starfield/resources')
}

// ─── System/Planet Catalog ────────────────────────────────────────────────────────

export async function saveSystem({ id, name }: { id?: string; name: string }) {
  if (id) {
    const system = await prisma.sfSystem.update({ where: { id }, data: { name } })
    revalidatePath('/starfield/systems')
    return system
  } else {
    const system = await prisma.sfSystem.create({ data: { name } })
    revalidatePath('/starfield/systems')
    return system
  }
}

export async function deleteSystem(id: string) {
  await prisma.sfSystem.delete({ where: { id } })
  revalidatePath('/starfield/systems')
}

export async function savePlanet({ id, name, systemId }: { id?: string; name: string; systemId: string }) {
  if (id) {
    const planet = await prisma.sfPlanet.update({ where: { id }, data: { name, systemId } })
    revalidatePath('/starfield/systems')
    return planet
  } else {
    const planet = await prisma.sfPlanet.create({ data: { name, systemId } })
    revalidatePath('/starfield/systems')
    return planet
  }
}

export async function deletePlanet(id: string) {
  await prisma.sfPlanet.delete({ where: { id } })
  revalidatePath('/starfield/systems')
}