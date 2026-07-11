import { useMemo, useState } from 'react'
import { InspectorHintRail } from './inspector-hint-rail'
import { StudioMobileRailContext } from './studio-mobile-rail-context'
import { StudioRailToggle } from './studio-rail-toggle'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export const INSPECTOR_PANEL_WIDTH = 300
export const STUDIO_RAIL_WIDTH = 260

export type InspectorSideState = 'hidden' | 'hint' | 'open'

export function StudioLayout({
  contextBar,
  rail,
  railLabel = 'Sections',
  canvas,
  inspectorState = 'hidden',
  inspectorHint,
  inspector,
}: {
  contextBar: React.ReactNode
  rail?: React.ReactNode
  /** Context-aware name for the rail toggle (e.g. "Laufar"). */
  railLabel?: string
  canvas: React.ReactNode
  inspectorState?: InspectorSideState
  inspectorHint?: string
  inspector?: React.ReactNode
}) {
  const inspectorOpen = inspectorState === 'open' && Boolean(inspector)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [desktopRailOpen, setDesktopRailOpen] = useState(true)
  const [mobileRailOpen, setMobileRailOpen] = useState(false)

  const railOpen = isDesktop ? desktopRailOpen : mobileRailOpen
  const setRailOpen = isDesktop ? setDesktopRailOpen : setMobileRailOpen

  const railContext = useMemo(() => {
    if (!rail) return null
    return {
      toggle: (
        <StudioRailToggle
          open={railOpen}
          onOpenChange={setRailOpen}
          label={railLabel}
        />
      ),
    }
  }, [rail, railOpen, railLabel, setRailOpen])

  return (
    <StudioMobileRailContext.Provider value={railContext}>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {contextBar}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {rail && desktopRailOpen ? (
            <div
              className="hidden shrink-0 flex-col overflow-hidden border-r border-border bg-column-rail lg:flex"
              style={{ width: STUDIO_RAIL_WIDTH }}
            >
              {rail}
            </div>
          ) : null}
          {rail && mobileRailOpen ? (
            <>
              <button
                type="button"
                className="absolute inset-0 z-40 bg-black/40 lg:hidden"
                aria-label={`Close ${railLabel.toLowerCase()}`}
                onClick={() => setMobileRailOpen(false)}
              />
              <div
                className="absolute inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-border bg-column-rail shadow-xl lg:hidden"
                style={{ width: Math.min(STUDIO_RAIL_WIDTH, 280) }}
              >
                <div
                  className="min-h-0 flex-1 overflow-y-auto"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a')) {
                      setMobileRailOpen(false)
                    }
                  }}
                >
                  {rail}
                </div>
              </div>
            </>
          ) : null}
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">{canvas}</div>
          {inspectorState === 'hint' && inspectorHint ? (
            <div className="hidden shrink-0 md:block">
              <InspectorHintRail message={inspectorHint} />
            </div>
          ) : null}
          {inspectorOpen ? (
            <div
              className={cn(
                'relative hidden shrink-0 flex-col overflow-x-hidden overflow-y-auto border-l border-border bg-column-inspector md:flex',
              )}
              style={{ width: INSPECTOR_PANEL_WIDTH }}
            >
              {inspector}
            </div>
          ) : null}
        </div>
        {inspectorOpen ? (
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[50dvh] flex-col overflow-hidden rounded-t-xl border-t border-border bg-column-inspector pb-[env(safe-area-inset-bottom)] shadow-2xl md:hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{inspector}</div>
          </div>
        ) : null}
      </div>
    </StudioMobileRailContext.Provider>
  )
}
