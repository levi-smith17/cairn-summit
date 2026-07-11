import { describe, expect, it } from 'vitest'
import type { BudgetUtilization } from '@/routes/provisions/cache-row'
import type { Supplyline } from '@/routes/provisions/supplyline-row'
import {
  effectiveCacheSpent,
  effectiveCacheUtilization,
  supplylineCountsAgainstCache,
  supplylineSpendForMarker,
} from './cache-supplyline'

function cache(markerId: string, spent: number, limit: number): BudgetUtilization {
  return {
    id: `cache-${markerId}`,
    markerId,
    marker: { id: markerId, name: markerId, color: '#000' },
    limit,
    spent,
    utilization: limit > 0 ? (spent / limit) * 100 : 0,
  }
}

function supplyline(
  markerId: string,
  amount: number,
  billingCycle: string,
  active = true,
): Supplyline {
  return {
    id: `sl-${markerId}-${billingCycle}`,
    name: 'Test',
    amount,
    billingCycle,
    nextRenewal: '2026-07-01',
    active,
    markers: [{ markerId, marker: { id: markerId, name: markerId, color: '#000' } }],
  }
}

describe('cache-supplyline', () => {
  it('counts monthly-or-shorter active supplylines against matching cache', () => {
    const lines = [
      supplyline('food', 30, 'MONTHLY'),
      supplyline('food', 120, 'QUARTERLY'),
      supplyline('food', 10, 'WEEKLY'),
    ]
    expect(supplylineCountsAgainstCache('MONTHLY')).toBe(true)
    expect(supplylineCountsAgainstCache('ANNUALLY')).toBe(false)
    expect(supplylineSpendForMarker(lines, 'food')).toBeCloseTo(30 + (10 * 52) / 12, 2)
  })

  it('adds supplyline spend to cache burn spend', () => {
    const spent = effectiveCacheSpent(cache('food', 50, 500), [supplyline('food', 30, 'MONTHLY')])
    expect(spent).toBe(80)
    expect(
      effectiveCacheUtilization(cache('food', 50, 500), [supplyline('food', 30, 'MONTHLY')]),
    ).toBe(16)
  })

  it('ignores inactive supplylines', () => {
    expect(supplylineSpendForMarker([supplyline('food', 30, 'MONTHLY', false)], 'food')).toBe(0)
  })
})
