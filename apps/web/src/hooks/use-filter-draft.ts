import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_FILTERS, type FilterState } from '@/lib/filters'

export function useFilterDraft(
  open: boolean,
  filters: FilterState,
  setFilters: (updates: Partial<FilterState>) => void,
  clearFilters: () => void,
) {
  const [draft, setDraft] = useState<FilterState>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const setDraftFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setDraft(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  const applyDraft = useCallback(() => {
    setFilters(draft)
  }, [draft, setFilters])

  const clearDraft = useCallback(() => {
    setDraft({ ...DEFAULT_FILTERS })
    clearFilters()
  }, [clearFilters])

  return { draft, setDraftFilter, applyDraft, clearDraft }
}
