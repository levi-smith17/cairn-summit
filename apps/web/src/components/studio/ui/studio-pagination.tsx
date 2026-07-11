import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

const pageButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'

export function StudioPagination({
  label,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  prevLabel = 'Previous page',
  nextLabel = 'Next page',
  'aria-label': ariaLabel = 'Pagination',
  className,
}: {
  label: React.ReactNode
  onPrev: () => void
  onNext: () => void
  canGoPrev: boolean
  canGoNext: boolean
  prevLabel?: string
  nextLabel?: string
  'aria-label'?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} role="group" aria-label={ariaLabel}>
      <ToolbarTooltip label={prevLabel}>
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={onPrev}
          className={pageButtonClass}
          aria-label={prevLabel}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </ToolbarTooltip>
      <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
        {label}
      </span>
      <ToolbarTooltip label={nextLabel}>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={onNext}
          className={pageButtonClass}
          aria-label={nextLabel}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </ToolbarTooltip>
    </div>
  )
}
