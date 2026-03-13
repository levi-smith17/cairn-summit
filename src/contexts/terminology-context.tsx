'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getTerms, type Terms, type TerminologyStyle } from '@/lib/terminology'

interface TerminologyContextValue {
  terminology: TerminologyStyle
  terms: Terms
  toggleTerminology: () => void
}

const TerminologyContext = createContext<TerminologyContextValue>({
  terminology: 'CAIRN',
  terms: getTerms('CAIRN'),
  toggleTerminology: () => {},
})

export function TerminologyProvider({ children }: { children: React.ReactNode }) {
  const [terminology, setTerminology] = useState<TerminologyStyle>('CAIRN')

  useEffect(() => {
    const stored = localStorage.getItem('platform-terminology') as TerminologyStyle | null
    if (stored === 'CAIRN' || stored === 'STANDARD') setTerminology(stored)
  }, [])

  function toggleTerminology() {
    const next: TerminologyStyle = terminology === 'CAIRN' ? 'STANDARD' : 'CAIRN'
    setTerminology(next)
    localStorage.setItem('platform-terminology', next)
  }

  return (
    <TerminologyContext.Provider value={{ terminology, terms: getTerms(terminology), toggleTerminology }}>
      {children}
    </TerminologyContext.Provider>
  )
}

export function useTerminology() {
  return useContext(TerminologyContext)
}
