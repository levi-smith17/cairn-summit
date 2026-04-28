'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ResourceListProps {
  resources: any[]
  resourceTypes: any[]
  selectedResourceId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (resource: any) => void
  onDelete: (id: string, name: string) => void
  totalCount: number
  currentPage: number
  pageSize: number
  isSearching: boolean
}

export function ResourceList({
  resources,
  resourceTypes,
  selectedResourceId,
  onSelect,
  onNew,
  onEdit,
  onDelete,
  totalCount,
  currentPage,
  pageSize,
  isSearching,
}: ResourceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Build the type-grouped list from whatever subset is on this page.
  // If a type carries over from the previous page it will still get a header
  // because we group by typeId within the current slice.
  const typeMap = new Map<string, any>()
  resourceTypes.forEach(t => typeMap.set(t.id, t))

  const groups: { type: any; items: any[] }[] = []
  for (const resource of resources) {
    const last = groups[groups.length - 1]
    if (last && last.type.id === resource.typeId) {
      last.items.push(resource)
    } else {
      groups.push({ type: typeMap.get(resource.typeId) ?? resource.type, items: [resource] })
    }
  }

  const displayCount = isSearching ? resources.length : totalCount

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">
          {displayCount} resource{displayCount !== 1 ? 's' : ''}
          {isSearching && resources.length < totalCount && (
            <span className="text-xs text-muted-foreground ml-1">(filtered)</span>
          )}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add resource</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map(({ type, items }) => (
          <div key={`${type.id}-${currentPage}`}>
            <div className="px-4 py-1.5 bg-muted/50 border-b border-border/50 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {type.name}{type.plural}
              </span>
              {!isSearching && currentPage > 1 && groups[0].type.id === type.id && (
                <span className="text-[10px] text-muted-foreground/60">(continued)</span>
              )}
            </div>
            {items.map(resource => (
              <div
                key={resource.id}
                className={`
                  flex items-center justify-between px-4 py-3 border-b border-border/50
                  cursor-pointer transition-colors group
                  ${selectedResourceId === resource.id ? 'bg-primary/20' : 'hover:bg-muted/50'}
                `}
                onClick={() => onSelect(resource.id)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{resource.name}</span>
                  <span className="text-xs text-muted-foreground">{resource.abbreviation}</span>
                </div>
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(resource)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(resource.id, resource.name)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {!isSearching && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
