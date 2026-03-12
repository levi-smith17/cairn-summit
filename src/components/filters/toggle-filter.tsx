'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ToggleFilterProps {
  active: boolean
  onToggle: () => void
  label: string
  icon?: React.ReactNode
  tooltip?: string
}

export function ToggleFilter({ active, onToggle, label, icon, tooltip }: ToggleFilterProps) {
  const button = (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      className="h-8 gap-1.5 text-sm"
      onClick={onToggle}
    >
      {icon}
      {label}
    </Button>
  )

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return button
}