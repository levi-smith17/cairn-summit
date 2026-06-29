import { useState, useEffect } from 'react'

export function useLocalFilterDraft<T>(open: boolean, applied: T) {
  const [draft, setDraft] = useState<T>(applied)

  useEffect(() => {
    if (open) setDraft(applied)
  }, [open, applied])

  return { draft, setDraft }
}
