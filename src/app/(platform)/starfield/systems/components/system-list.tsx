'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'

interface SystemListProps {
  systems: any[]
  selectedSystemId: string | null
  onSelect: (id: string) => void
  onEdit: (system: any) => void
  onDelete: (id: string, name: string) => void
  onAddPlanet: (systemId: string) => void
}

export function SystemList({
  systems,
  selectedSystemId,
  onSelect,
  onEdit,
  onDelete,
  onAddPlanet,
}: SystemListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">Systems</span>
        <span className="text-xs text-muted-foreground">{systems.length} systems</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {systems.map(system => (
          <div
            key={system.id}
            className={`
              flex items-center justify-between px-4 py-3 border-b border-border/50
              cursor-pointer transition-colors group
              ${selectedSystemId === system.id ? 'bg-primary/20' : 'hover:bg-muted/50'}
            `}
            onClick={() => onSelect(system.id)}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{system.name}</span>
              <span className="text-xs text-muted-foreground">
                {system.planets.length} planet{system.planets.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddPlanet(system.id)}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(system)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(system.id, system.name)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}