'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface FacilityListProps {
  facilities: any[]
  selectedFacilityId: string | null
  onSelect: (id: string) => void
  onEdit: (facility: any) => void
  onDelete: (id: string, name: string) => void
}

export function FacilityList({ facilities, selectedFacilityId, onSelect, onEdit, onDelete }: FacilityListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">Facilities</span>
        <span className="text-xs text-muted-foreground">{facilities.length} facilities</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {facilities.map(facility => (
          <div
            key={facility.id}
            className={`
              flex items-center justify-between px-4 py-3 border-b border-border/50
              cursor-pointer transition-colors group
              ${selectedFacilityId === facility.id ? 'bg-primary/20' : 'hover:bg-muted/50'}
            `}
            onClick={() => onSelect(facility.id)}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">[{facility.abbreviation}] {facility.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {facility.planet.name} ({facility.planet.system.name})
              </span>
            </div>
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(facility)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(facility.id, facility.name)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
