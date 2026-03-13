'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { savePlanet } from '@/actions/starfield'

interface SystemDetailProps {
  system: any | null
  onBack: () => void
  onDeletePlanet: (id: string, name: string) => void
}

export function SystemDetail({ system, onBack, onDeletePlanet }: SystemDetailProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newName.trim() || !system) return
    setSaving(true)
    await savePlanet({ name: newName.trim(), systemId: system.id })
    setNewName('')
    setAdding(false)
    setSaving(false)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId || !editName.trim() || !system) return
    setSaving(true)
    await savePlanet({ id: editingId, name: editName.trim(), systemId: system.id })
    setEditingId(null)
    setEditName('')
    setSaving(false)
  }

  function startEdit(planet: any) {
    setEditingId(planet.id)
    setEditName(planet.name)
    setAdding(false)
  }

  if (!system) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Select a system to view its planets.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-sm font-medium">{system.name}</span>
            <p className="text-xs text-muted-foreground">
              {system.planets.length} planet{system.planets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setAdding(true); setEditingId(null) }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add planet</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {adding && (
          <form onSubmit={handleAdd} className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/30">
            <Input
              autoFocus
              placeholder="Planet name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-7 text-sm flex-1"
              disabled={saving}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={saving || !newName.trim()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setAdding(false); setNewName('') }} disabled={saving}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}

        {system.planets.length === 0 && !adding ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No planets yet.
          </div>
        ) : (
          system.planets.map((planet: any) => (
            editingId === planet.id ? (
              <form
                key={planet.id}
                onSubmit={handleEdit}
                className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/30"
              >
                <Input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="h-7 text-sm flex-1"
                  disabled={saving}
                />
                <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={saving || !editName.trim()}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setEditingId(null); setEditName('') }} disabled={saving}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </form>
            ) : (
              <div key={planet.id} className="border-b border-border/50">
                <div className="flex items-center justify-between px-4 py-3 group hover:bg-muted/30 transition-colors">
                  <div>
                    <span className="text-sm font-medium">{planet.name}</span>
                    {planet.facilities.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {planet.facilities.map((f: any) => `[${f.abbreviation}] ${f.name}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(planet)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeletePlanet(planet.id, planet.name)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  )
}
