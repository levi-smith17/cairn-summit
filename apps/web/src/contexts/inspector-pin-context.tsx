'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { readInspectorPinned, writeInspectorPinned } from '@/lib/inspector-pinned'

interface InspectorPinContextValue {
  pinned: boolean
  setPinned: (pinned: boolean) => void
}

const InspectorPinContext = createContext<InspectorPinContextValue>({
  pinned: false,
  setPinned: () => {},
})

export function InspectorPinProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinnedState] = useState(readInspectorPinned)
  const setPinned = useCallback((value: boolean) => {
    setPinnedState(value)
    writeInspectorPinned(value)
  }, [])

  return (
    <InspectorPinContext.Provider value={{ pinned, setPinned }}>
      {children}
    </InspectorPinContext.Provider>
  )
}

export function useInspectorPin() {
  return useContext(InspectorPinContext)
}
