import { describe, it, expect } from 'vitest'
import type { SfOutpostResource, SfResource } from '@cairn/types'
import { validateNetwork } from './starfield-validation'
import type { OutpostWithId } from './starfield-utils'

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

function globalResource(
  id: string,
  opts: Partial<SfResource> = {}
): SfResource {
  return {
    pk: 'SF#RESOURCE',
    sk: `RESOURCE#${id}`,
    name: id,
    abbreviation: id.slice(0, 2),
    type: 'Solid',
    tier: null,
    mined: false,
    ingredients: [],
    ...opts,
  } as SfResource
}

describe('validateNetwork', () => {
  it('satisfies import when source is onsite and stale fromOutpostId is overridden by planet+system', () => {
    const source = outpost(
      'khayyam-iii-b',
      [res('iron', { onsite: true })],
      'Khayyam III-b',
      'Khayyam'
    )
    const consumer = outpost(
      'khayyam-ii-a',
      [
        res('iron', {
          supplies: [{
            fromPlanet: 'Khayyam III-b',
            fromSystem: 'Khayyam',
            fromOutpostId: 'stale-facility-id',
          }],
        }),
      ],
      'Khayyam II-a',
      'Khayyam'
    )
    const resources = [globalResource('iron')]
    const result = validateNetwork([source, consumer], resources)
    const rv = result.get('khayyam-ii-a')?.resources.get('iron')
    expect(rv?.status).toBe('satisfied')
  })

  it('ignores empty supply rows when a valid import line exists', () => {
    const source = outpost('a', [res('iron', { onsite: true })], 'Alpha', 'Sol')
    const consumer = outpost('b', [
      res('iron', {
        supplies: [
          { fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' },
          { fromPlanet: null, fromSystem: null, fromOutpostId: null },
        ],
      }),
    ], 'Beta', 'Sol')
    const result = validateNetwork([source, consumer], [globalResource('iron')])
    expect(result.get('b')?.resources.get('iron')?.status).toBe('satisfied')
  })

  it('marks cyclic imports as missing', () => {
    const a = outpost('a', [
      res('iron', {
        supplies: [{ fromPlanet: 'Beta', fromSystem: 'Sol', fromOutpostId: 'b' }],
      }),
    ], 'Alpha', 'Sol')
    const b = outpost('b', [
      res('iron', {
        supplies: [{ fromPlanet: 'Alpha', fromSystem: 'Sol', fromOutpostId: 'a' }],
      }),
    ], 'Beta', 'Sol')
    const result = validateNetwork([a, b], [globalResource('iron')])
    expect(result.get('a')?.resources.get('iron')?.status).toBe('missing')
    expect(result.get('b')?.resources.get('iron')?.status).toBe('missing')
  })

  it('satisfies origin-only resource without a source outpost on the network', () => {
    const o = outpost('solo', [res('iron', { origin: true, supplies: [] })])
    const result = validateNetwork([o], [globalResource('iron')])
    expect(result.get('solo')?.resources.get('iron')?.status).toBe('satisfied')
  })
})
