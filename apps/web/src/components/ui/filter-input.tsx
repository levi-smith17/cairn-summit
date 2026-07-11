import { Filter, X } from 'lucide-react'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

/** Text filter field with a leading filter icon (Asgard FilterInput pattern). */
export function FilterInput({
  value,
  onChange,
  placeholder = 'Filter',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md border border-border bg-input px-2',
        className,
      )}
    >
      <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
      {value ? (
        <ToolbarTooltip label="Clear filter">
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
            aria-label="Clear filter"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </ToolbarTooltip>
      ) : null}
    </div>
  )
}
