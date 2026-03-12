'use client'

import { Tag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'

interface MarkerItem {
  id: string
  name: string
  color: string
  icon: string | null
  _count: { waypoints: number }
}

interface MarkerListProps {
  markers: MarkerItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function MarkerList({ markers, selectedId, onSelect, onNew }: MarkerListProps) {
  const { terms } = useTerminology()
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {markers.length} {markers.length !== 1 ? terms.markers.toLowerCase() : terms.markers.slice(0, -1).toLowerCase()}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add {terms.markers.slice(0, -1).toLowerCase()}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {markers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <Tag className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No {terms.markers.toLowerCase()} yet.</p>
            <button
              onClick={onNew}
              className="text-sm text-primary hover:underline mt-1"
            >
              Create your first {terms.markers.slice(0, -1).toLowerCase()}
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {markers.map(marker => (
              <button
                key={marker.id}
                onClick={() => onSelect(marker.id)}
                className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedId === marker.id ? 'bg-primary/10 hover:bg-primary/10' : ''
                }`}
              >
                <MarkerBadge marker={marker} />
                <span className="text-xs text-muted-foreground mt-1 pl-0.5">
                  {marker._count.waypoints} {marker._count.waypoints !== 1 ? terms.waypoints.toLowerCase() : terms.waypoints.slice(0, -1).toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
