import { getSupplylinesSummary, saveCache } from '@/lib/api/supplylines'

export type CacheCarryOverResult = {
  count: number
  sourceMonth: number
  sourceYear: number
}

export type CacheCarryItem = {
  markerId: string
  limit: number
}

function previousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

/** Copy selected cache limits into a target month (skips markers already present). */
export async function carrySelectedCacheToMonth(
  targetMonth: number,
  targetYear: number,
  items: CacheCarryItem[],
): Promise<{ created: number; skipped: number }> {
  if (items.length === 0) return { created: 0, skipped: 0 }

  const targetSummary = await getSupplylinesSummary(targetMonth, targetYear)
  const existingMarkerIds = new Set(
    (targetSummary.cacheUtilization ?? []).map((b: { markerId: string }) => b.markerId),
  )

  let created = 0
  let skipped = 0

  for (const item of items) {
    if (existingMarkerIds.has(item.markerId)) {
      skipped++
      continue
    }
    await saveCache({
      markerId: item.markerId,
      limit: item.limit,
      month: targetMonth,
      year: targetYear,
    })
    existingMarkerIds.add(item.markerId)
    created++
  }

  return { created, skipped }
}

/** Copy cache limits from the most recent prior month that has budgets. */
export async function carryOverCacheToMonth(
  targetMonth: number,
  targetYear: number,
  options?: { maxMonthsBack?: number },
): Promise<CacheCarryOverResult | null> {
  const maxMonthsBack = options?.maxMonthsBack ?? 24

  const targetSummary = await getSupplylinesSummary(targetMonth, targetYear)
  const existingMarkerIds = new Set(
    (targetSummary.cacheUtilization ?? []).map((b: { markerId: string }) => b.markerId),
  )

  let { month, year } = previousMonth(targetMonth, targetYear)

  for (let i = 0; i < maxMonthsBack; i++) {
    const summary = await getSupplylinesSummary(month, year)
    const cacheUtilization = (summary.cacheUtilization ?? []) as Array<{
      markerId: string
      limit: number
    }>
    const toCreate = cacheUtilization.filter((b) => !existingMarkerIds.has(b.markerId))

    if (toCreate.length > 0) {
      const result = await carrySelectedCacheToMonth(
        targetMonth,
        targetYear,
        toCreate.map((b) => ({ markerId: b.markerId, limit: b.limit })),
      )
      if (result.created === 0) {
        ;({ month, year } = previousMonth(month, year))
        continue
      }
      return { count: result.created, sourceMonth: month, sourceYear: year }
    }

    ;({ month, year } = previousMonth(month, year))
  }

  return null
}

export function shiftMonth(
  month: number,
  year: number,
  delta: number,
): { month: number; year: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

export function monthYearLabel(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}
