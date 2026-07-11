import { toMarkerId } from '@/lib/embedded-markers'
import type { BudgetUtilization } from '@/routes/provisions/cache-row'
import type { Supplyline } from '@/routes/provisions/supplyline-row'

const MONTHLY_OR_LESS = new Set(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])

export function supplylineCountsAgainstCache(billingCycle: string): boolean {
  return MONTHLY_OR_LESS.has(billingCycle)
}

export function supplylineMonthlyAmount(amount: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'WEEKLY':
      return (amount * 52) / 12
    case 'BIWEEKLY':
      return (amount * 26) / 12
    case 'MONTHLY':
      return amount
    default:
      return 0
  }
}

export function supplylineSpendForMarker(supplylines: Supplyline[], markerId: string): number {
  return supplylines
    .filter((line) => line.active)
    .filter((line) => supplylineCountsAgainstCache(line.billingCycle))
    .filter((line) => line.markers.some((marker) => toMarkerId(marker) === markerId))
    .reduce((sum, line) => sum + supplylineMonthlyAmount(line.amount, line.billingCycle), 0)
}

export function effectiveCacheSpent(
  cache: BudgetUtilization,
  supplylines: Supplyline[],
): number {
  return cache.spent + supplylineSpendForMarker(supplylines, cache.markerId)
}

export function effectiveCacheUtilization(
  cache: BudgetUtilization,
  supplylines: Supplyline[],
): number {
  const spent = effectiveCacheSpent(cache, supplylines)
  return cache.limit > 0 ? (spent / cache.limit) * 100 : 0
}

export function totalEffectiveCacheUtilization(
  cacheUtilization: BudgetUtilization[],
  supplylines: Supplyline[],
): number | null {
  const totalSpent = cacheUtilization.reduce(
    (sum, cache) => sum + effectiveCacheSpent(cache, supplylines),
    0,
  )
  const totalLimit = cacheUtilization.reduce((sum, cache) => sum + cache.limit, 0)
  return totalLimit > 0 ? (totalSpent / totalLimit) * 100 : null
}
