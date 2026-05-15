'use client'

import { useState } from 'react'
import { Check, ChevronRight, type LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** When value equals this, render the label as muted (treated as the "all/unset" state) */
  placeholderValue?: string
  /** Icon shown on the left of the trigger */
  icon?: LucideIcon
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
  triggerClassName?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  placeholderValue,
  icon: Icon,
  disabled = false,
  align = 'start',
  triggerClassName = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)
  const isPlaceholderState = placeholderValue !== undefined && value === placeholderValue
  const muted = isPlaceholderState || !selected

  function handleSelect(optionValue: string) {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('h-10 gap-1.5 text-sm justify-start', triggerClassName)}
        >
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className={`flex-1 text-left truncate ${muted ? 'text-muted-foreground' : ''}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronRight className="h-3 w-3 shrink-0 rotate-90 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-40 p-0 overflow-hidden"
        align={align}
        sideOffset={4}
      >
        <div className="max-h-64 overflow-y-auto py-1">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs transition-colors text-left ${
                option.value === value ? 'bg-muted/50' : 'hover:bg-muted/40'
              }`}
            >
              <span className="flex-1 truncate">{option.label}</span>
              {option.value === value && <Check className="h-3 w-3 shrink-0 text-foreground/60" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
