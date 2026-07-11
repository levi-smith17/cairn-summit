import { createContext, useContext } from 'react'

type StudioMobileRailContextValue = {
  toggle: React.ReactNode
}

export const StudioMobileRailContext = createContext<StudioMobileRailContextValue | null>(null)

/** Used by StudioContextBar to render the mobile rail toggle before the page title. */
export function useStudioMobileRailToggle(): React.ReactNode {
  return useContext(StudioMobileRailContext)?.toggle ?? null
}
