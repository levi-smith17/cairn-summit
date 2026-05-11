import { Folder, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'

interface Trail {
  id: string
  name: string
  _count: { waypoints: number }
}

interface TrailListProps {
  trails: Trail[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function TrailList({ trails, selectedId, onSelect, onNew }: TrailListProps) {
  const { terms } = useTerminology()
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {trails.length} {trails.length !== 1 ? terms.trails.toLowerCase() : terms.trails.slice(0, -1).toLowerCase()}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add {terms.trails.slice(0, -1).toLowerCase()}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <Folder className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No {terms.trails.toLowerCase()} yet.</p>
            <button
              onClick={onNew}
              className="text-sm text-primary hover:underline mt-1"
            >
              Create your first {terms.trails.slice(0, -1).toLowerCase()}
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {trails.map(trail => (
              <button
                key={trail.id}
                onClick={() => onSelect(trail.id)}
                className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selectedId === trail.id ? 'bg-primary/10 hover:bg-primary/10' : ''}`}
              >
                <span className="text-sm font-medium">{trail.name}</span>
                <span className="text-xs text-muted-foreground">
                  {trail._count.waypoints} {trail._count.waypoints !== 1 ? terms.waypoints.toLowerCase() : terms.waypoints.slice(0, -1).toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
