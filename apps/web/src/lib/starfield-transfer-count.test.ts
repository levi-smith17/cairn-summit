import { describe, it, expect } from 'vitest'
import type { SfOutpostResource } from '@cairn/types'
import { countTransferStations, type OutpostWithId } from './starfield-utils'

function outpost(
  id: string,
  resources: SfOutpostResource[],
  planet = id,
  system = 'Sol'
): OutpostWithId {
  return {
    id,
    pk: 'USER#u',
    sk: `SF#FACILITY#${id}`,
    networkId: 'n1',
    system,
    planet,
    depth: 0,
    position: { x: 0, y: 0 },
    resources,
    transferStationLimit: 32,
  }
}

function res(
  resourceId: string,
  opts: Partial<SfOutpostResource> = {}
): SfOutpostResource {
  return {
    resourceId,
    name: resourceId,
    abbreviation: resourceId.slice(0, 3),
    onsite: false,
    supplies: [],
    ...opts,
  }
}

describe('countTransferStations', () => {
  it('returns 0 for onsite only with no consumers', () => {
    const a = outpost('a', [res('polymer', { onsite: true })])
    expect(countTransferStations(a, [a])).toBe(0)
  })

  it('counts 1 inbound on B and 1 outbound on A', () => {
    const a = outpost('a', [res('polymer', { onsite: true })], 'Alpha', 'Sol')
    const b = outpost('b', [
      res('polymer', {
        supplies: [{ fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' }],
      }),
    ], 'Beta', 'Sol')
    expect(countTransferStations(b, [a, b])).toBe(1)
    expect(countTransferStations(a, [a, b])).toBe(1)
  })

  it('does not count import on A when A is onsite-only and B imports', () => {
    const a = outpost('a', [res('polymer', { onsite: true })], 'Alpha', 'Sol')
    const b = outpost('b', [
      res('polymer', {
        supplies: [{ fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' }],
      }),
    ], 'Beta', 'Sol')
    expect(countTransferStations(a, [a, b])).toBe(1)
  })

  it('counts 2 inbound for two supply lines on one resource', () => {
    const a = outpost('a', [res('polymer', { onsite: true })], 'Alpha', 'Sol')
    const b = outpost('b', [
      res('polymer', {
        supplies: [
          { fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' },
          { fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' },
        ],
      }),
    ], 'Beta', 'Sol')
    expect(countTransferStations(b, [a, b])).toBe(2)
    expect(countTransferStations(a, [a, b])).toBe(2)
  })

  it('counts 2 outbound when B and C import from A', () => {
    const a = outpost('a', [res('polymer', { onsite: true })], 'Alpha', 'Sol')
    const b = outpost('b', [
      res('polymer', {
        supplies: [{ fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' }],
      }),
    ], 'Beta', 'Sol')
    const c = outpost('c', [
      res('polymer', {
        supplies: [{ fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' }],
      }),
    ], 'Gamma', 'Sol')
    expect(countTransferStations(a, [a, b, c])).toBe(2)
  })

  it('does not count origin entries', () => {
    const a = outpost('a', [res('polymer', { origin: true, supplies: [] })])
    expect(countTransferStations(a, [a])).toBe(0)
  })
})
