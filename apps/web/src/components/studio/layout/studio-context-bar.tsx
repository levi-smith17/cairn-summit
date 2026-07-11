import { useStudioMobileRailToggle } from '@/components/studio/layout/studio-mobile-rail-context'
import { cn } from '@/lib/utils'

/** Page header bar (gray / card) — consistent across pages. Page-specific controls belong in StudioDataToolbar. */
export function StudioContextBar({
  'aria-label': ariaLabel,
  title,
  subtitle,
  leading,
  metadata,
  tabs,
  actions,
}: {
  'aria-label': string
  title: string
  subtitle?: string
  /** Extra content before the title (in addition to the mobile rail toggle). */
  leading?: React.ReactNode
  metadata?: React.ReactNode
  tabs?: React.ReactNode
  actions: React.ReactNode
}) {
  const hasTabs = Boolean(tabs)
  const railToggle = useStudioMobileRailToggle()

  return (
    <header
      className={cn(
        'box-border shrink-0 border-b border-border bg-header',
        hasTabs &&
          'lg:grid lg:h-14 lg:min-h-14 lg:max-h-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-2 lg:overflow-hidden lg:px-4',
        !hasTabs &&
          'flex h-14 min-h-14 max-h-14 items-center justify-between gap-2 overflow-hidden px-3 sm:px-4',
      )}
      role="toolbar"
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          'flex min-w-0 items-center gap-2',
          hasTabs &&
            'box-border h-14 min-h-14 max-h-14 justify-between overflow-hidden px-3 sm:px-4 lg:h-full lg:min-h-0 lg:max-h-none lg:justify-start lg:overflow-visible lg:px-0 lg:justify-self-start',
          !hasTabs && 'min-w-0 flex-1',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {railToggle}
          {leading}
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {metadata}
        </div>
        {hasTabs ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">{actions}</div>
        ) : null}
      </div>

      {hasTabs ? (
        <div className="box-border flex h-14 min-h-14 max-h-14 justify-center overflow-x-auto border-t border-border scrollbar-none lg:h-full lg:min-h-0 lg:max-h-none lg:items-center lg:justify-center lg:overflow-hidden lg:border-t-0 lg:justify-self-center">
          {tabs}
        </div>
      ) : null}

      <div
        className={cn(
          hasTabs
            ? 'hidden shrink-0 items-center justify-end gap-2 lg:flex lg:justify-self-end'
            : 'flex shrink-0 items-center gap-1.5 sm:gap-2',
        )}
      >
        {actions}
      </div>
    </header>
  )
}
