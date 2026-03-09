'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  FilterState,
  DEFAULT_FILTERS,
  parseFiltersFromParams,
  filtersToParams,
} from '@/lib/filters'

export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters = parseFiltersFromParams(searchParams)

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const current = parseFiltersFromParams(searchParams)
      const updated = { ...current, [key]: value }
      const params = filtersToParams(updated)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [pathname, router])

  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const current = parseFiltersFromParams(searchParams)
      const updated = { ...current, ...updates }
      const params = filtersToParams(updated)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    isPending,
    defaults: DEFAULT_FILTERS,
  }
}