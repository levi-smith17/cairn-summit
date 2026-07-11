import { cn } from '@/lib/utils'

/** Fixed 56px inspector top chrome — aligns with page context bars. */
export const INSPECTOR_CHROME_CLASS =
  'box-border flex h-14 min-h-14 max-h-14 shrink-0 items-center gap-2 overflow-hidden border-b border-border px-4'

export function InspectorChrome({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(INSPECTOR_CHROME_CLASS, className)}>{children}</div>
}

/** Compact title stack that fits inside {@link InspectorChrome}. */
export function InspectorChromeTitle({
  eyebrow,
  title,
  meta,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <div className="min-w-0 flex-1 leading-tight">
      {eyebrow ? (
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      {meta}
    </div>
  )
}
