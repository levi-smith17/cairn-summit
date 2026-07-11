import { useCallback, useState } from 'react'
import { readInspectorPinned, writeInspectorPinned } from '@/lib/inspector-pinned'

export function useInspectorPinned() {
  const [pinned, setPinnedState] = useState(readInspectorPinned)

  const setPinned = useCallback((value: boolean) => {
    setPinnedState(value)
    writeInspectorPinned(value)
  }, [])

  return [pinned, setPinned] as const
}
