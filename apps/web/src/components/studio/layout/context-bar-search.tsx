import { useEffect, useRef } from 'react'
import { Filter, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

function isInsideStudioPortal(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-studio-portal]'))
}

export function ContextBarSearch({
  expanded,
  onExpandedChange,
  query,
  onQueryChange,
  placeholder,
  tooltipLabel = 'Search',
  enabled = true,
  triggerIcon = 'search',
  expandedPanel,
  active = false,
  onClearAll,
}: {
  expanded: boolean
  onExpandedChange: (open: boolean) => void
  query: string
  onQueryChange: (value: string) => void
  placeholder: string
  tooltipLabel?: string
  enabled?: boolean
  triggerIcon?: 'search' | 'filter'
  /** Optional content shown under the expanded input without changing toolbar height. */
  expandedPanel?: React.ReactNode
  /** Highlight the collapsed trigger when nested filters are active. */
  active?: boolean
  /** Clears nested palette filters when the X button dismisses the control. */
  onClearAll?: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const TriggerIcon = triggerIcon === 'filter' ? Filter : Search
  const hasPanel = Boolean(expandedPanel)
  const triggerActive = active || query.trim().length > 0

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  useEffect(() => {
    if (!expanded) return

    const collapse = () => {
      onExpandedChange(false)
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      if (isInsideStudioPortal(target)) return
      collapse()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      collapse()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded, onExpandedChange])

  if (!enabled) {
    return (
      <ToolbarTooltip label="Search unavailable on this tab">
        <button
          type="button"
          disabled
          className="rounded-md p-2 text-muted-foreground/40"
          aria-label="Search unavailable"
        >
          <TriggerIcon className="h-4 w-4" />
        </button>
      </ToolbarTooltip>
    )
  }

  const clearAndCollapse = () => {
    onQueryChange('')
    onClearAll?.()
    onExpandedChange(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'h-9 transition-[width] duration-200 ease-out',
          expanded ? 'w-56' : 'w-9',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'absolute right-0 top-0 z-50 overflow-hidden border bg-card transition-[width,max-height,border-color,border-radius,box-shadow] duration-200 ease-out',
          expanded
            ? cn(
                'w-56 border-border',
                hasPanel ? 'max-h-[min(28rem,70vh)] rounded-md bg-card shadow-md' : 'max-h-9 rounded-md bg-input',
              )
            : 'w-9 max-h-9 rounded-md border-transparent bg-transparent shadow-none',
        )}
      >
        <div className="flex h-9 items-center">
          {!expanded ? (
            <ToolbarTooltip label={tooltipLabel}>
              <button
                type="button"
                onClick={() => onExpandedChange(true)}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted-hover hover:text-foreground',
                  triggerActive && 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
                )}
                aria-label={tooltipLabel}
              >
                <TriggerIcon className="h-4 w-4" />
              </button>
            </ToolbarTooltip>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-1 pl-2.5 pr-1">
              <TriggerIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={placeholder}
                className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
              />
              <ToolbarTooltip label={triggerIcon === 'filter' ? 'Clear Filters' : 'Close Search'}>
                <button
                  type="button"
                  onClick={clearAndCollapse}
                  className="rounded p-1 text-muted-foreground hover:bg-muted-hover hover:text-foreground"
                  aria-label={triggerIcon === 'filter' ? 'Clear filters' : 'Close search'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </ToolbarTooltip>
            </div>
          )}
        </div>
        {hasPanel ? (
          <div className="border-t border-border p-2">{expandedPanel}</div>
        ) : null}
      </div>
    </div>
  )
}
