import { cn } from '@/lib/utils'

/** Labeled control row for use inside a ContextBarSearch filter palette. */
export function FilterPaletteField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex w-full items-center gap-2', className)} role="group" aria-label={label}>
      <span className="w-14 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function FilterPaletteStack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>
}
