import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'

export function ContextBarAddButton({
  label,
  shortLabel,
  onClick,
}: {
  label: string
  shortLabel?: string
  onClick: () => void
}) {
  const visibleLabel = shortLabel ?? label

  return (
    <ToolbarTooltip label={label}>
      <Button
        type="button"
        onClick={onClick}
        className="h-9 gap-1.5 bg-emerald-800 px-2.5 text-white shadow-sm hover:bg-emerald-900 hover:text-white sm:px-4 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{visibleLabel}</span>
      </Button>
    </ToolbarTooltip>
  )
}
