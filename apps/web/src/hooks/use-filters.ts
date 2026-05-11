import { useCallback, useTransition } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  FilterState,
  DEFAULT_FILTERS,
  parseFiltersFromParams,
  filtersToParams,
} from '@/lib/filters'

export function useFilters() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters = parseFiltersFromParams(searchParams)

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const current = parseFiltersFromParams(searchParams)
      const updated = { ...current, [key]: value }
      const params = filtersToParams(updated)
      startTransition(() => {
        setSearchParams(params)
      })
    },
    [searchParams, setSearchParams]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      navigate(pathname)
    })
  }, [pathname, navigate])

  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const current = parseFiltersFromParams(searchParams)
      const updated = { ...current, ...updates }
      const params = filtersToParams(updated)
      startTransition(() => {
        setSearchParams(params)
      })
    },
    [searchParams, setSearchParams]
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
