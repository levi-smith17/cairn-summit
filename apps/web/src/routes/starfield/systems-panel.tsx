import { useState } from 'react'
import { X, ArrowLeft, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Planet {
  id: string
  name: string
}

interface SystemEntry {
  id: string
  name: string
  planets: Planet[]
}

interface SystemsPanelProps {
  systems: SystemEntry[]
  onClose: () => void
  onSystemCreate: (name: string) => void
  onSystemRename: (id: string, newName: string) => void
  onSystemDelete: (id: string) => void
  onPlanetCreate: (systemId: string, name: string) => void
  onPlanetRename: (systemId: string, planetId: string, newName: string) => void
  onPlanetDelete: (systemId: string, planetId: string) => void
}

interface InlineInputProps {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  placeholder: string
}

function InlineInput({ value, onChange, onSave, onCancel, placeholder }: InlineInputProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onSave() }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="h-8 text-sm flex-1"
        autoFocus
      />
      <Button type="button" size="sm" className="h-8 px-3 shrink-0" onClick={onSave} disabled={!value.trim()}>
        Save
      </Button>
      <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function SystemsPanel({
  systems,
  onClose,
  onSystemCreate,
  onSystemRename,
  onSystemDelete,
  onPlanetCreate,
  onPlanetRename,
  onPlanetDelete,
}: SystemsPanelProps) {
  const [view, setView] = useState<'systems' | 'planets'>('systems')
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null)

  const [addingSystem, setAddingSystem] = useState(false)
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
  const [systemInput, setSystemInput] = useState('')

  const [addingPlanet, setAddingPlanet] = useState(false)
  const [editingPlanetId, setEditingPlanetId] = useState<string | null>(null)
  const [planetInput, setPlanetInput] = useState('')

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'system' | 'planet'
    id: string
    name: string
    systemId?: string
  } | null>(null)

  const activeSystem = systems.find(s => s.id === activeSystemId) ?? null
  const sortedSystems = [...systems].sort((a, b) => a.name.localeCompare(b.name))
  const sortedPlanets = [...(activeSystem?.planets ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  function drillInto(id: string) {
    setActiveSystemId(id)
    setView('planets')
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetInput('')
  }

  function goBack() {
    setView('systems')
    setActiveSystemId(null)
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetInput('')
    setAddingSystem(false)
    setEditingSystemId(null)
    setSystemInput('')
  }

  function saveSystem() {
    const name = systemInput.trim()
    if (!name) return
    if (editingSystemId) {
      onSystemRename(editingSystemId, name)
      setEditingSystemId(null)
    } else {
      onSystemCreate(name)
      setAddingSystem(false)
    }
    setSystemInput('')
  }

  function savePlanet() {
    const name = planetInput.trim()
    if (!name || !activeSystemId) return
    if (editingPlanetId) {
      onPlanetRename(activeSystemId, editingPlanetId, name)
      setEditingPlanetId(null)
    } else {
      onPlanetCreate(activeSystemId, name)
      setAddingPlanet(false)
    }
    setPlanetInput('')
  }

  function executeDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'system') {
      onSystemDelete(confirmDelete.id)
      if (activeSystemId === confirmDelete.id) goBack()
    } else {
      onPlanetDelete(confirmDelete.systemId!, confirmDelete.id)
    }
    setConfirmDelete(null)
  }

  if (view === 'planets' && activeSystem) {
    return (
      <>
        <div className="flex flex-col h-full">
          <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 mr-2" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activeSystem.name}</p>
              <p className="text-xs text-muted-foreground">{sortedPlanets.length} planet{sortedPlanets.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive/80"
                    onClick={() => setConfirmDelete({ type: 'system', id: activeSystem.id, name: activeSystem.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete system</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedPlanets.length === 0 && !addingPlanet && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No planets yet.</p>
            )}
            {sortedPlanets.map(planet => (
              <div key={planet.id} className="flex items-center group border-b border-border/50 last:border-0">
                {editingPlanetId === planet.id ? (
                  <div className="flex-1">
                    <InlineInput
                      value={planetInput}
                      onChange={setPlanetInput}
                      onSave={savePlanet}
                      onCancel={() => { setEditingPlanetId(null); setPlanetInput('') }}
                      placeholder="Planet name…"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditingPlanetId(planet.id); setPlanetInput(planet.name); setAddingPlanet(false) }}
                      className="p-3.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex-1 py-3.5 text-sm">{planet.name}</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'planet', id: planet.id, name: planet.name, systemId: activeSystem.id })}
                      className="p-3.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border shrink-0">
            {addingPlanet ? (
              <InlineInput
                value={planetInput}
                onChange={setPlanetInput}
                onSave={savePlanet}
                onCancel={() => { setAddingPlanet(false); setPlanetInput('') }}
                placeholder="Planet name…"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setAddingPlanet(true); setEditingPlanetId(null); setPlanetInput('') }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Planet
              </button>
            )}
          </div>
        </div>

        <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {confirmDelete?.type === 'system' ? 'system' : 'planet'} "{confirmDelete?.name}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDelete?.type === 'system'
                  ? 'This will delete the system and all its planets. Outposts referencing it will not be affected.'
                  : 'This will remove the planet from the list.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <div className="flex-1">
            <p className="text-sm font-medium">{sortedSystems.length} system{sortedSystems.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setAddingSystem(true); setEditingSystemId(null); setSystemInput('') }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add system</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedSystems.length === 0 && !addingSystem && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No systems yet.</p>
          )}
          {sortedSystems.map(sys => (
            <div key={sys.id} className="flex items-center group border-b border-border/50 last:border-0">
              {editingSystemId === sys.id ? (
                <div className="flex-1">
                  <InlineInput
                    value={systemInput}
                    onChange={setSystemInput}
                    onSave={saveSystem}
                    onCancel={() => { setEditingSystemId(null); setSystemInput('') }}
                    placeholder="System name…"
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setEditingSystemId(sys.id); setSystemInput(sys.name); setAddingSystem(false) }}
                    className="p-3.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => drillInto(sys.id)}
                    className="flex-1 flex items-center gap-3 pr-4 py-3.5 text-sm text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex-1">{sys.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{sys.planets.length}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ type: 'system', id: sys.id, name: sys.name })}
                    className="p-3.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {addingSystem && (
            <InlineInput
              value={systemInput}
              onChange={setSystemInput}
              onSave={saveSystem}
              onCancel={() => { setAddingSystem(false); setSystemInput('') }}
              placeholder="System name…"
            />
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete system "{confirmDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the system and all its planets. Outposts referencing it will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
