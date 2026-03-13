'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { saveSystem } from '@/actions/starfield'

interface SystemListProps {
  systems: any[]
  selectedSystemId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string, name: string) => void
}

export function SystemList({ systems, selectedSystemId, onSelect, onDelete }: SystemListProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await saveSystem({ name: newName.trim() })
    setNewName('')
    setAdding(false)
    setSaving(false)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId || !editName.trim()) return
    setSaving(true)
    await saveSystem({ id: editingId, name: editName.trim() })
    setEditingId(null)
    setEditName('')
    setSaving(false)
  }

  function startEdit(system: any, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(system.id)
    setEditName(system.name)
    setAdding(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function cancelAdd() {
    setAdding(false)
    setNewName('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">
          {systems.length} system{systems.length !== 1 ? 's' : ''}
        </span>
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
          <TooltipContent>Add system</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {adding && (
          <form onSubmit={handleAdd} className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/30">
            <Input
              autoFocus
              placeholder="System name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-7 text-sm flex-1"
              disabled={saving}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={saving || !newName.trim()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelAdd} disabled={saving}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}

        {systems.map(system => (
          editingId === system.id ? (
            <form
              key={system.id}
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
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit} disabled={saving}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </form>
          ) : (
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
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => startEdit(system, e)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onDelete(system.id, system.name) }}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
