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
      <Button type="button" onClick={onClick} className="h-9 gap-1.5 px-2.5 shadow-sm sm:px-4">
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{visibleLabel}</span>
      </Button>
    </ToolbarTooltip>
  )
}
