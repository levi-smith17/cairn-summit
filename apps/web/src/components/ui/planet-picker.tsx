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
// PlanetPicker is deprecated — system/planet are now plain text strings on facilities
async function saveSystem(_: { id?: string; name: string }) { return _ as any }
async function savePlanet(_: { id?: string; name: string; systemId: string }) { return _ as any }
async function deleteSystem(_: string) { /* no-op */ }
async function deletePlanet(_: string) { /* no-op */ }

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
  onChange: (id: string) => void
  systems: SystemWithPlanets[]
  onSystemsUpdate: (systems: SystemWithPlanets[]) => void
  placeholder?: string
  disabled?: boolean
}

// ── InlineInput ───────────────────────────────────────────────────────────────
// Defined outside PlanetPicker so React doesn't remount it on every render.

interface InlineInputProps {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  onRemove?: () => void   // only provided when editing (not adding)
  placeholder: string
  saving: boolean
}

function InlineInput({ value: v, onChange: oc, onSave, onCancel, onRemove, placeholder: ph, saving }: InlineInputProps) {
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
        disabled={saving || !v.trim()}
      >
        Save
      </Button>
      <button type="button" onClick={onCancel} className="p-1.5 text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-destructive hover:text-destructive/80 transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ── PlanetPicker ──────────────────────────────────────────────────────────────

export function PlanetPicker({
  value,
  onChange,
  systems,
  onSystemsUpdate,
  placeholder = 'Select a planet…',
  disabled = false,
}: PlanetPickerProps) {
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

  const [saving, setSaving] = useState(false)

  // Confirmation dialog state
  const [confirmRemove, setConfirmRemove] = useState<{
    type: 'system' | 'planet'
    id: string
    name: string
  } | null>(null)
  const [removing, setRemoving] = useState(false)

  // Derived display label
  const allPlanets = systems.flatMap(s => s.planets.map(p => ({ ...p, systemName: s.name })))
  const selectedPlanet = allPlanets.find(p => p.id === value)
  const displayLabel = selectedPlanet ? `${selectedPlanet.name} (${selectedPlanet.systemName})` : null

  const activeSystem = systems.find(s => s.id === activeSystemId) ?? null

  function handleOpenChange(isOpen: boolean) {
    // Don't close while a confirmation dialog is active
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

  // ── System CRUD ──────────────────────────────────────────────────────────────

  async function saveSystemInline() {
    const name = systemNameInput.trim()
    if (!name) return
    setSaving(true)
    try {
      if (editingSystemId) {
        const updated = await saveSystem({ id: editingSystemId, name })
        onSystemsUpdate(systems.map(s => s.id === editingSystemId ? { ...s, name: updated.name } : s))
        setEditingSystemId(null)
      } else {
        const created = await saveSystem({ name })
        onSystemsUpdate([...systems, { ...created, planets: [] }])
        setAddingSystem(false)
      }
      setSystemNameInput('')
    } finally {
      setSaving(false)
    }
  }

  function startEditSystem(sys: SystemWithPlanets, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingSystemId(sys.id)
    setSystemNameInput(sys.name)
    setAddingSystem(false)
  }

  function cancelSystem() {
    setAddingSystem(false)
    setEditingSystemId(null)
    setSystemNameInput('')
  }

  // ── Planet CRUD ──────────────────────────────────────────────────────────────

  async function savePlanetInline() {
    const name = planetNameInput.trim()
    if (!name || !activeSystemId) return
    setSaving(true)
    try {
      if (editingPlanetId) {
        const updated = await savePlanet({ id: editingPlanetId, name, systemId: activeSystemId })
        onSystemsUpdate(systems.map(s =>
          s.id === activeSystemId
            ? { ...s, planets: s.planets.map(p => p.id === editingPlanetId ? { ...p, name: updated.name } : p) }
            : s
        ))
        setEditingPlanetId(null)
      } else {
        const created = await savePlanet({ name, systemId: activeSystemId })
        onSystemsUpdate(systems.map(s =>
          s.id === activeSystemId ? { ...s, planets: [...s.planets, created] } : s
        ))
        setAddingPlanet(false)
      }
      setPlanetNameInput('')
    } finally {
      setSaving(false)
    }
  }

  function startEditPlanet(planet: Planet, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingPlanetId(planet.id)
    setPlanetNameInput(planet.name)
    setAddingPlanet(false)
  }

  function cancelPlanet() {
    setAddingPlanet(false)
    setEditingPlanetId(null)
    setPlanetNameInput('')
  }

  // ── Remove (with confirmation) ────────────────────────────────────────────────

  async function executeRemove() {
    if (!confirmRemove) return
    setRemoving(true)
    try {
      if (confirmRemove.type === 'system') {
        await deleteSystem(confirmRemove.id)
        // If selected planet was in this system, clear selection
        const removedSystem = systems.find(s => s.id === confirmRemove.id)
        if (removedSystem?.planets.some(p => p.id === value)) onChange('')
        onSystemsUpdate(systems.filter(s => s.id !== confirmRemove.id))
        cancelSystem()
        if (activeSystemId === confirmRemove.id) goBack()
      } else {
        await deletePlanet(confirmRemove.id)
        if (value === confirmRemove.id) onChange('')
        onSystemsUpdate(systems.map(s =>
          s.id === activeSystemId
            ? { ...s, planets: s.planets.filter(p => p.id !== confirmRemove.id) }
            : s
        ))
        cancelPlanet()
      }
    } finally {
      setRemoving(false)
      setConfirmRemove(null)
    }
  }

  // ── Filtered lists ────────────────────────────────────────────────────────────

  const isSearching = search.trim().length > 0
  const q = search.toLowerCase()

  const filteredSystems = systems
    .filter(s => !search || s.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))

  const filteredPlanets = (activeSystem?.planets ?? [])
    .filter(p => !search || p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))

  const searchResults = isSearching
    ? systems
        .flatMap(s => s.planets.map(p => ({ ...p, systemName: s.name, systemId: s.id })))
        .filter(p => p.name.toLowerCase().includes(q) || p.systemName.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  function selectPlanet(planetId: string) {
    if (value === planetId) {
      onChange('')
    } else {
      onChange(planetId)
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
            className="h-10 gap-1.5 text-sm justify-start w-full"
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
              <button
                type="button"
                onClick={goBack}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
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
                    const isSelected = value === planet.id
                    return (
                      <button
                        key={planet.id}
                        type="button"
                        onClick={() => selectPlanet(planet.id)}
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
                          saving={saving}
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={e => startEditSystem(sys, e)}
                          className="p-3.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => drillIntoSystem(sys.id)}
                          className="flex-1 flex items-center gap-3 pr-4 py-3.5 text-sm text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="flex-1">{sys.name} ({sys.planets.length})</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
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
                  const isSelected = value === planet.id
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
                            saving={saving}
                          />
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={e => startEditPlanet(planet, e)}
                            className="p-3.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => selectPlanet(planet.id)}
                            className={`flex-1 flex items-center gap-3 pr-4 py-3.5 text-sm text-left transition-colors
                              ${isSelected ? 'bg-primary/15' : 'hover:bg-muted/50'}`}
                          >
                            <span className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0
                              ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </span>
                            <span className="flex-1">{planet.name}</span>
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Fixed footer — Add button (hidden while searching) */}
          {!isSearching && (
            <div className="border-t border-border shrink-0">
              {view === 'systems' && (
                addingSystem ? (
                  <InlineInput
                    value={systemNameInput}
                    onChange={setSystemNameInput}
                    onSave={saveSystemInline}
                    onCancel={cancelSystem}
                    placeholder="System name…"
                    saving={saving}
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
                    saving={saving}
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
                ? 'This will permanently remove the system and all its planets. This cannot be undone.'
                : 'This will permanently remove the planet. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRemove}
              disabled={removing}
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
