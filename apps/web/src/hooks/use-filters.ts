import { useCallback, useTransition } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FilterState,
  DEFAULT_FILTERS,
  parseFiltersFromParams,
  filtersToParams,
} from '@/lib/filters'

function mergePreservedParams(params: URLSearchParams, searchParams: URLSearchParams) {
  const id = searchParams.get('id')
  if (id) params.set('id', id)
  return params
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters = parseFiltersFromParams(searchParams)

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const current = parseFiltersFromParams(searchParams)
      const updated = { ...current, [key]: value }
      const params = mergePreservedParams(filtersToParams(updated), searchParams)
      startTransition(() => {
        setSearchParams(params)
      })
    },
    [searchParams, setSearchParams]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams()
      const id = searchParams.get('id')
      if (id) params.set('id', id)
      setSearchParams(params)
    })
  }, [searchParams, setSearchParams])

  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const current = parseFiltersFromParams(searchParams)
      const updated = { ...current, ...updates }
      const params = mergePreservedParams(filtersToParams(updated), searchParams)
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
