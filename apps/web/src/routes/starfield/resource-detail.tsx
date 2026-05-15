import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

interface ResourceInfoProps {
  resource: any | null
  onBack: () => void
  onEdit: (resource: any) => void
  onDelete: (id: string, name: string) => void
}

export function ResourceInfo({ resource, onBack, onEdit, onDelete }: ResourceInfoProps) {
  if (!resource) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Select a resource to view details.
      </div>
    )
  }

  const ingredients = [resource.resource1, resource.resource2, resource.resource3, resource.resource4].filter(Boolean)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{resource.name}</span>
              <Badge variant="outline" className="text-xs">{resource.abbreviation}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{resource.type.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7" onClick={() => onEdit(resource)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7" onClick={() => onDelete(resource.id, resource.name)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {ingredients.length > 0 && (
          <div className="border-b border-border">
            <div className="px-4 py-2 bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipe</span>
            </div>
            {ingredients.map((ing: any) => (
              <div key={ing.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 text-sm">
                <Badge variant="outline" className="text-xs font-mono">{ing.abbreviation}</Badge>
                <span>{ing.name}</span>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Produced at · {resource.outpostResources.length}
            </span>
          </div>
          {resource.outpostResources.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              Not assigned to any outpost.
            </div>
          ) : (
            resource.outpostResources.map((fr: any) => (
              <div key={fr.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 text-sm">
                <Badge variant="secondary" className="text-xs font-mono shrink-0">{fr.outpost.abbreviation}</Badge>
                <span>{fr.outpost.name}</span>
                <span className="text-muted-foreground text-xs ml-auto shrink-0">
                  {fr.planet.name} ({fr.planet.system.name})
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
