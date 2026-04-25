'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  align?: 'start' | 'center' | 'end'
  /** Width class for the trigger button, e.g. "w-28" */
  triggerClassName?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  align = 'start',
  triggerClassName = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  function handleSelect(optionValue: string) {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 md:h-8 gap-1.5 text-sm justify-start ${triggerClassName}`}
        >
          <span className="flex-1 text-left truncate">
            {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
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
