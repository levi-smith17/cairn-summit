import { PanelLeft } from 'lucide-react'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

/** Toggles the Studio left rail (desktop collapse + mobile overlay). */
export function StudioRailToggle({
  open,
  onOpenChange,
  label: _label = 'Sections',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** @deprecated Labels are fixed to Show/Hide Rail. */
  label?: string
}) {
  void _label
  const showLabel = 'Show Rail'
  const hideLabel = 'Hide Rail'

  return (
    <ToolbarTooltip label={open ? hideLabel : showLabel}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground',
          open && 'bg-primary/15 text-primary',
        )}
        aria-pressed={open}
        aria-label={open ? hideLabel : showLabel}
      >
        <PanelLeft className="h-4 w-4" aria-hidden />
      </button>
    </ToolbarTooltip>
  )
}
