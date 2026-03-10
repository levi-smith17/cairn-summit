'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'

interface SystemDetailProps {
  system: any | null
  onBack: () => void
  onEditPlanet: (planet: any) => void
  onDeletePlanet: (id: string, name: string) => void
  onAddPlanet: (systemId: string) => void
}

export function SystemDetail({
  system,
  onBack,
  onEditPlanet,
  onDeletePlanet,
  onAddPlanet,
}: SystemDetailProps) {
  if (!system) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Select a system to view its planets.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-sm font-medium">{system.name}</span>
            <p className="text-xs text-muted-foreground">
              {system.planets.length} planet{system.planets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onAddPlanet(system.id)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Planet
        </Button>
      </div>

      {/* Planet list */}
      <div className="flex-1 overflow-y-auto">
        {system.planets.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No planets yet.
          </div>
        ) : (
          system.planets.map((planet: any) => (
            <div key={planet.id} className="border-b border-border/50">
              {/* Planet row */}
              <div className="flex items-center justify-between px-4 py-3 group hover:bg-muted/30 transition-colors">
                <div>
                  <span className="text-sm font-medium">{planet.name}</span>
                  {planet.facilities.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {planet.facilities.map((f: any) => `[${f.abbreviation}] ${f.name}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditPlanet(planet)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeletePlanet(planet.id, planet.name)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}