'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { Globe, ChevronRight, ArrowLeft, Check, Plus, Pencil, X, Trash2 } from 'lucide-react'

interface Planet {
  id: string
  name: string
}

interface SystemWithPlanets {
  id: string
  name: string
  planets: Planet[]
}

interface PlanetPickerProps {
  value: string
  onChange: (planetName: string) => void
  onSystemChange?: (systemName: string) => void
  onSelectId?: (planetId: string) => void
  systems: SystemWithPlanets[]
  onSystemsUpdate?: (systems: SystemWithPlanets[]) => void
  onSystemCreate?: (name: string) => void
  onSystemRename?: (id: string, newName: string) => void
  onSystemDelete?: (id: string) => void
  onPlanetCreate?: (systemId: string, name: string) => void
  onPlanetRename?: (systemId: string, planetId: string, newName: string) => void
  onPlanetDelete?: (systemId: string, planetId: string) => void
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** When false, only search/select — no add/edit/delete systems or planets */
  allowManageSystems?: boolean
}

function safeName(name: string | undefined): string {
  return (name ?? '').trim()
}

// ── InlineInput ───────────────────────────────────────────────────────────────
// Defined outside PlanetPicker so React doesn't remount it on every render.

interface InlineInputProps {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  onRemove?: () => void
  placeholder: string
}

function InlineInput({ value: v, onChange: oc, onSave, onCancel, onRemove, placeholder: ph }: InlineInputProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Input
        value={v}
        onChange={e => oc(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onSave() }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={ph}
        className="h-9 text-sm flex-1"
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        className="h-9 px-3 shrink-0"
        onClick={onSave}
        disabled={!(v ?? '').trim()}
      >
        Save
      </Button>
      {onRemove && (
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── PlanetPicker ──────────────────────────────────────────────────────────────

export function PlanetPicker({
  value,
  onChange,
  onSystemChange,
  onSelectId,
  systems,
  onSystemsUpdate,
  onSystemCreate,
  onSystemRename,
  onSystemDelete,
  onPlanetCreate,
  onPlanetRename,
  onPlanetDelete,
  placeholder = 'Select a planet…',
  disabled = false,
  readonly = false,
  allowManageSystems = true,
}: PlanetPickerProps) {
  const canManage = allowManageSystems && !readonly
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'systems' | 'planets'>('systems')
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // System inline editing state
  const [addingSystem, setAddingSystem] = useState(false)
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
  const [systemNameInput, setSystemNameInput] = useState('')

  // Planet inline editing state
  const [addingPlanet, setAddingPlanet] = useState(false)
  const [editingPlanetId, setEditingPlanetId] = useState<string | null>(null)
  const [planetNameInput, setPlanetNameInput] = useState('')

  // Confirmation dialog state
  const [confirmRemove, setConfirmRemove] = useState<{
    type: 'system' | 'planet'
    id: string
    name: string
  } | null>(null)

  // Derived display label
  const allPlanets = systems.flatMap(s =>
    s.planets.map(p => ({ ...p, systemName: safeName(s.name), systemId: s.id }))
  )
  const selectedPlanet = allPlanets.find(p => p.name === value)
  const displayLabel = selectedPlanet ? `${selectedPlanet.name} (${selectedPlanet.systemName})` : value || null

  const activeSystem = systems.find(s => s.id === activeSystemId) ?? null

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && confirmRemove !== null) return
    setOpen(isOpen)
    if (!isOpen) {
      setView('systems')
      setSearch('')
      setAddingSystem(false)
      setEditingSystemId(null)
      setSystemNameInput('')
      setAddingPlanet(false)
      setEditingPlanetId(null)
      setPlanetNameInput('')
    }
  }

  function drillIntoSystem(sysId: string) {
    setActiveSystemId(sysId)
    setView('planets')
    setSearch('')
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetNameInput('')
  }

  function goBack() {
    setView('systems')
    setSearch('')
    setActiveSystemId(null)
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetNameInput('')
    setAddingSystem(false)
    setEditingSystemId(null)
    setSystemNameInput('')
  }

  // ── System CRUD (local state only) ───────────────────────────────────────────

  function saveSystemInline() {
    const name = systemNameInput.trim()
    if (!name) return
    if (editingSystemId) {
      onSystemRename?.(editingSystemId, name)
      setEditingSystemId(null)
    } else {
      const exists = systems.some(s => safeName(s.name).toLowerCase() === name.toLowerCase())
      if (!exists) onSystemCreate?.(name)
      setAddingSystem(false)
    }
    setSystemNameInput('')
  }

  function startEditSystem(sys: SystemWithPlanets, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingSystemId(sys.id)
    setSystemNameInput(safeName(sys.name))
    setAddingSystem(false)
  }

  function cancelSystem() {
    setAddingSystem(false)
    setEditingSystemId(null)
    setSystemNameInput('')
  }

  // ── Planet CRUD (local state only) ───────────────────────────────────────────

  function savePlanetInline() {
    const name = planetNameInput.trim()
    if (!name || !activeSystemId) return
    const active = systems.find(s => s.id === activeSystemId)
    if (editingPlanetId) {
      onPlanetRename?.(activeSystemId, editingPlanetId, name)
      setEditingPlanetId(null)
    } else {
      const exists = active?.planets.some(
        p => safeName(p.name).toLowerCase() === name.toLowerCase()
      )
      if (!exists) onPlanetCreate?.(activeSystemId, name)
      setAddingPlanet(false)
    }
    setPlanetNameInput('')
  }

  function startEditPlanet(planet: Planet, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingPlanetId(planet.id)
    setPlanetNameInput(safeName(planet.name))
    setAddingPlanet(false)
  }

  function cancelPlanet() {
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetNameInput('')
  }

  // ── Remove (with confirmation) ────────────────────────────────────────────────

  function executeRemove() {
    if (!confirmRemove) return
    if (confirmRemove.type === 'system') {
      const removedSystem = systems.find(s => s.id === confirmRemove.id)
      if (removedSystem?.planets.some(p => p.name === value)) {
        onChange('')
        onSystemChange?.('')
      }
      onSystemDelete?.(confirmRemove.id)
      cancelSystem()
      if (activeSystemId === confirmRemove.id) goBack()
    } else {
      if (value === confirmRemove.name) {
        onChange('')
        onSystemChange?.('')
      }
      onPlanetDelete?.(activeSystemId!, confirmRemove.id)
      cancelPlanet()
    }
    setConfirmRemove(null)
  }

  // ── Filtered lists ────────────────────────────────────────────────────────────

  const isSearching = search.trim().length > 0
  const q = search.toLowerCase()

  const filteredSystems = systems
    .filter(s => !search || safeName(s.name).toLowerCase().includes(q))
    .sort((a, b) => safeName(a.name).localeCompare(safeName(b.name)))

  const filteredPlanets = (activeSystem?.planets ?? [])
    .filter(p => !search || safeName(p.name).toLowerCase().includes(q))
    .sort((a, b) => safeName(a.name).localeCompare(safeName(b.name)))

  const searchResults = isSearching
    ? systems
        .flatMap(s => s.planets.map(p => ({ ...p, systemName: safeName(s.name), systemId: s.id })))
        .filter(p =>
          safeName(p.name).toLowerCase().includes(q) ||
          safeName(p.systemName).toLowerCase().includes(q)
        )
        .sort((a, b) => safeName(a.name).localeCompare(safeName(b.name)))
    : []

  function selectPlanet(planetName: string, systemName?: string, planetId?: string) {
    if (value === planetName) {
      onChange('')
      onSystemChange?.('')
      onSelectId?.('')
    } else {
      onChange(planetName)
      if (systemName) onSystemChange?.(systemName)
      if (planetId !== undefined) onSelectId?.(planetId)
      setOpen(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-9 md:h-8 gap-1.5 text-sm justify-start w-full"
          >
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={`flex-1 text-left truncate ${!displayLabel ? 'text-muted-foreground' : ''}`}>
              {displayLabel ?? placeholder}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 rotate-90 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0 bg-secondary border-border" align="start">
          {/* Header: search + optional back button */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            {view === 'planets' && !isSearching && (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <input
              placeholder="Search planets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground p-0.5">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Breadcrumb label when in planet view (not searching) */}
          {view === 'planets' && activeSystem && !isSearching && (
            <div className="px-4 py-2 bg-muted/30 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">{activeSystem.name}</p>
            </div>
          )}

          {/* Scrollable list */}
          <div className="max-h-72 overflow-y-auto">

            {/* ── Unified search results ── */}
            {isSearching && (
              searchResults.length === 0
                ? <p className="px-4 py-5 text-sm text-muted-foreground text-center">No planets found.</p>
                : searchResults.map(planet => {
                    const isSelected = value === planet.name
                    return (
                      <button
                        key={`${planet.systemId}-${planet.id}`}
                        type="button"
                        onClick={() => selectPlanet(planet.name, planet.systemName, planet.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left transition-colors
                          ${isSelected ? 'bg-primary/15' : 'hover:bg-muted/50'}`}
                      >
                        <span className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0
                          ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                        <span className="flex-1 truncate">{planet.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{planet.systemName}</span>
                      </button>
                    )
                  })
            )}

            {/* ── Systems view ── */}
            {!isSearching && view === 'systems' && (
              <>
                {filteredSystems.length === 0 && (
                  <p className="px-4 py-5 text-sm text-muted-foreground text-center">No systems yet.</p>
                )}
                {filteredSystems.map(sys => (
                  <div key={sys.id} className="flex items-center group border-b border-border/50 last:border-0">
                    {editingSystemId === sys.id ? (
                      <div className="flex-1">
                        <InlineInput
                          value={systemNameInput}
                          onChange={setSystemNameInput}
                          onSave={saveSystemInline}
                          onCancel={cancelSystem}
                          onRemove={() => setConfirmRemove({ type: 'system', id: sys.id, name: sys.name })}
                          placeholder="System name…"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex flex-col justify-center py-3 pl-4 pr-2 min-w-0">
                          <span className="text-sm truncate">{sys.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{sys.planets.length} {sys.planets.length === 1 ? 'planet' : 'planets'}</span>
                        </div>
                        {canManage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 mr-1"
                            onClick={e => startEditSystem(sys, e)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 mr-3"
                          onClick={() => drillIntoSystem(sys.id)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── Planets view ── */}
            {!isSearching && view === 'planets' && (
              <>
                {filteredPlanets.length === 0 && (
                  <p className="px-4 py-5 text-sm text-muted-foreground text-center">No planets in this system.</p>
                )}
                {filteredPlanets.map(planet => {
                  const isSelected = value === planet.name
                  return (
                    <div key={planet.id} className="flex items-center group border-b border-border/50 last:border-0">
                      {editingPlanetId === planet.id ? (
                        <div className="flex-1">
                          <InlineInput
                            value={planetNameInput}
                            onChange={setPlanetNameInput}
                            onSave={savePlanetInline}
                            onCancel={cancelPlanet}
                            onRemove={() => setConfirmRemove({ type: 'planet', id: planet.id, name: planet.name })}
                            placeholder="Planet name…"
                          />
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => selectPlanet(planet.name, activeSystem?.name, planet.id)}
                            className={`flex-1 flex items-center gap-3 pl-4 ${readonly ? 'pr-4' : 'pr-2'} py-3.5 text-sm text-left transition-colors
                              ${isSelected ? 'bg-primary/15' : 'hover:bg-muted/50'}`}
                          >
                            <span className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0
                              ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </span>
                            <span className="flex-1">{planet.name}</span>
                          </button>
                          {canManage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 mr-3"
                              onClick={e => startEditPlanet(planet, e)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Fixed footer — Add button (hidden while searching or readonly) */}
          {!isSearching && canManage && (
            <div className="border-t border-border shrink-0">
              {view === 'systems' && (
                addingSystem ? (
                  <InlineInput
                    value={systemNameInput}
                    onChange={setSystemNameInput}
                    onSave={saveSystemInline}
                    onCancel={cancelSystem}
                    placeholder="System name…"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingSystem(true); setEditingSystemId(null); setSystemNameInput('') }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add System
                  </button>
                )
              )}
              {view === 'planets' && (
                addingPlanet ? (
                  <InlineInput
                    value={planetNameInput}
                    onChange={setPlanetNameInput}
                    onSave={savePlanetInline}
                    onCancel={cancelPlanet}
                    placeholder="Planet name…"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingPlanet(true); setEditingPlanetId(null); setPlanetNameInput('') }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Planet
                  </button>
                )
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Remove confirmation dialog — rendered outside Popover so it isn't clipped */}
      <AlertDialog open={confirmRemove !== null} onOpenChange={open => { if (!open) setConfirmRemove(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {confirmRemove?.type === 'system' ? 'system' : 'planet'} "{confirmRemove?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove?.type === 'system'
                ? 'This will remove the system and all its planets from the list.'
                : 'This will remove the planet from the list.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
