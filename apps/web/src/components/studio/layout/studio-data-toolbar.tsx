import { cn } from '@/lib/utils'

/** Page context bar under the header — fixed 56px, canvas-black background. */
export const STUDIO_CONTEXT_BAR_CLASS =
  'relative z-30 box-border flex h-14 min-h-14 max-h-14 shrink-0 items-center overflow-visible border-b border-border bg-context-bar px-3 sm:px-6 lg:px-8'

export function StudioDataToolbar({
  leading,
  description,
  trailing,
  className,
}: {
  leading?: React.ReactNode
  description?: string
  trailing: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(STUDIO_CONTEXT_BAR_CLASS, className)} role="toolbar">
      <div className="flex w-full min-w-0 items-center justify-between gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-3">
        <div className="flex min-w-0 items-center gap-0.5 justify-self-start">{leading}</div>
        {description ? (
          <p className="hidden text-center text-xs text-muted-foreground md:block lg:justify-self-center">
            {description}
          </p>
        ) : (
          <div className="hidden lg:block" aria-hidden />
        )}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:justify-self-end">
          {trailing}
        </div>
      </div>
    </div>
  )
}
