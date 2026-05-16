import { useState } from 'react'
import { Check, ChevronRight, Search, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface KinPickerOption {
  value: string
  label: string
}

interface KinPickerProps {
  value: string
  onChange: (id: string) => void
  options: KinPickerOption[]
  placeholder?: string
  disabled?: boolean
  triggerClassName?: string
}

export function KinPicker({ value, onChange, options, placeholder = 'Select person…', disabled = false, triggerClassName }: KinPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const q = search.toLowerCase()
  const filtered = q
    ? options.filter(o => o.value === '' || o.label.toLowerCase().includes(q))
    : options

  const selectedLabel = options.find(o => o.value === value)?.label

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('h-9 md:h-8 gap-1.5 text-sm justify-start', triggerClassName)}
        >
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={cn('flex-1 text-left truncate', !value && 'text-muted-foreground')}>
            {value ? selectedLabel ?? placeholder : (options.find(o => o.value === '')?.label ?? placeholder)}
          </span>
          <ChevronRight className="h-3 w-3 shrink-0 rotate-90 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-secondary border-border" align="start">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {filtered.length > 0 ? (
            filtered.map(option => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  option.value === value ? 'bg-primary/15' : 'hover:bg-muted/60',
                  option.value === '' && 'text-muted-foreground italic'
                )}
                onClick={() => handleSelect(option.value)}
              >
                <span className="w-3.5 shrink-0 flex items-center justify-center">
                  {option.value === value && <Check className="h-3 w-3" />}
                </span>
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">No results.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
