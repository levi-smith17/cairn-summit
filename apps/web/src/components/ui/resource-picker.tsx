'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Database, ChevronRight, Check, Search, X } from 'lucide-react'

interface Resource {
  id: string
  name: string
  abbreviation: string
  typeId: string
  type: { id: string; name: string }
}

interface ResourcePickerProps {
  value: string[]
  onChange: (ids: string[]) => void
  options: Resource[]
  /** Maximum number of resources that can be selected. Defaults to 4. Set to 1 for single-select. */
  maxSelect?: number
  placeholder?: string
  disabled?: boolean
}

interface ItemRowProps {
  item: Resource
  isSelected: boolean
  isDisabled: boolean
  onToggle: (id: string) => void
}

function ItemRow({ item, isSelected, isDisabled, onToggle }: ItemRowProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      disabled={isDisabled}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors
        ${isSelected ? 'bg-primary/15' : 'hover:bg-muted/60'}
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0
        ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
      <span className="flex-1 truncate">{item.name}</span>
      <span className="text-xs text-muted-foreground shrink-0 font-mono">{item.abbreviation}</span>
    </button>
  )
}

export function ResourcePicker({
  value,
  onChange,
  options,
  maxSelect = 4,
  placeholder,
  disabled = false,
}: ResourcePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isSingleSelect = maxSelect === 1
  const defaultPlaceholder = isSingleSelect ? 'Select resource…' : 'Select resources…'

  // Group options by resource type, sorted alphabetically
  const grouped = options.reduce<Record<string, { typeName: string; items: Resource[] }>>((acc, r) => {
    const key = r.type.id
    if (!acc[key]) acc[key] = { typeName: r.type.name, items: [] }
    acc[key].items.push(r)
    return acc
  }, {})
  Object.values(grouped).forEach(g => g.items.sort((a, b) => a.name.localeCompare(b.name)))
  const groupEntries = Object.entries(grouped).sort((a, b) => a[1].typeName.localeCompare(b[1].typeName))

  // Flat filtered list when searching
  const q = search.toLowerCase()
  const filteredFlat = q
    ? options
        .filter(r => r.name.toLowerCase().includes(q) || r.abbreviation.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id))
    } else if (value.length < maxSelect) {
      const next = isSingleSelect ? [id] : [...value, id]
      onChange(next)
      if (isSingleSelect) setOpen(false)
    }
  }

  function removeChip(id: string) {
    onChange(value.filter(v => v !== id))
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSearch('')
  }

  const selectedResources = value.map(id => options.find(o => o.id === id)).filter(Boolean) as Resource[]
  const hasValue = value.length > 0
  const atMax = value.length >= maxSelect

  const triggerLabel = hasValue
    ? selectedResources.map(r => r.name).join(', ')
    : (placeholder ?? defaultPlaceholder)

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-10 gap-1.5 text-sm justify-start w-full"
          >
            <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={`flex-1 text-left truncate ${!hasValue ? 'text-muted-foreground' : ''}`}>
              {triggerLabel}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 rotate-90 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0 bg-secondary border-border" align="start">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search resources…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground p-0.5">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Count hint — only for multi-select */}
          {!isSingleSelect && (
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {value.length}/{maxSelect} selected{atMax && ' — remove one to add another'}
              </p>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {/* Flat search results */}
            {q ? (
              filteredFlat.length > 0
                ? filteredFlat.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      isSelected={value.includes(item.id)}
                      isDisabled={!value.includes(item.id) && atMax}
                      onToggle={toggle}
                    />
                  ))
                : <p className="px-4 py-5 text-sm text-muted-foreground text-center">No results.</p>
            ) : (
              /* Accordion grouped by type — single open at a time */
              <Accordion type="single" collapsible className="w-full">
                {groupEntries.map(([typeId, { typeName, items }]) => (
                  <AccordionItem key={typeId} value={typeId} className="border-b border-border last:border-0">
                    <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline hover:bg-muted/40">
                      <span className="flex items-center gap-2">
                        {typeName}
                        {!isSingleSelect && items.some(i => value.includes(i.id)) && (
                          <span className="text-xs text-primary font-normal">
                            ({items.filter(i => value.includes(i.id)).length})
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      {items.map(item => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          isSelected={value.includes(item.id)}
                          isDisabled={!value.includes(item.id) && atMax}
                          onToggle={toggle}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips — only for multi-select */}
      {!isSingleSelect && selectedResources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedResources.map(r => (
            <span key={r.id} className="inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-1.5 bg-muted/30">
              {r.name}
              <button
                type="button"
                onClick={() => removeChip(r.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
