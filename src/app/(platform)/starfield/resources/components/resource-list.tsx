'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ResourceListProps {
  resources: any[]
  resourceTypes: any[]
  selectedResourceId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onEdit: (resource: any) => void
  onDelete: (id: string, name: string) => void
}

export function ResourceList({ resources, resourceTypes, selectedResourceId, onSelect, onNew, onEdit, onDelete }: ResourceListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">
          {resources.length} resource{resources.length !== 1 ? 's' : ''}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add resource
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 overflow-y-auto">
        {resourceTypes.map(type => {
          const typeResources = resources.filter(r => r.typeId === type.id)
          if (typeResources.length === 0) return null
          return (
            <div key={type.id}>
              <div className="px-4 py-1.5 bg-muted/50 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{type.name}{type.plural}</span>
              </div>
              {typeResources.map(resource => (
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
          )
        })}
      </div>
    </div>
  )
}
