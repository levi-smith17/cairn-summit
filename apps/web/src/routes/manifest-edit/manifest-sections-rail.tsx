import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type ManifestRailSection<T extends string> = {
  id: T
  label: string
  icon: LucideIcon
  count: number | null
}

export function ManifestSectionsRail<T extends string>({
  sections,
  activeSection,
  onSelectSection,
  addSections,
  onAddSection,
}: {
  sections: ManifestRailSection<T>[]
  activeSection: T
  onSelectSection: (sectionId: T) => void
  addSections?: ManifestRailSection<T>[]
  onAddSection?: (sectionId: T) => void
  /** @deprecated Public live link removed from Sections header */
  liveUrl?: string | null
}) {
  const [addOpen, setAddOpen] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!addOpen) return
    const onDoc = (event: MouseEvent) => {
      if (!addRef.current?.contains(event.target as Node)) setAddOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [addOpen])

  const addable = addSections ?? []

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">Sections</span>
        <div className="flex items-center gap-0.5">
          {addable.length > 0 && onAddSection ? (
            <div ref={addRef} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-haspopup="menu"
                    aria-expanded={addOpen}
                    onClick={() => setAddOpen((open) => !open)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to section</TooltipContent>
              </Tooltip>
              {addOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-card py-0.5 shadow-lg"
                >
                  {addable.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onAddSection(section.id)
                          setAddOpen(false)
                        }}
                        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted-hover"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{section.label}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sections.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={cn(
                'flex w-full items-center justify-between gap-2 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted-hover',
                active && 'bg-primary/10 hover:bg-primary/10',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{section.label}</span>
              </span>
              {section.count !== null && section.count > 0 ? (
                <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                  {section.count}
                </Badge>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
