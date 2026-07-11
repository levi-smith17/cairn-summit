import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function contextTabClass(active: boolean, disabled = false) {
  return cn(
    'relative flex h-full shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors sm:px-4',
    disabled
      ? 'cursor-not-allowed text-muted-foreground/50'
      : active
        ? 'text-primary'
        : 'text-muted-foreground hover:text-foreground',
  )
}

export function ContextTabIndicator() {
  return <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
}

export function ContextTabButton({
  active,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" className={cn(contextTabClass(!!active), className)} {...props}>
      {children}
      {active ? <ContextTabIndicator /> : null}
    </button>
  )
}
