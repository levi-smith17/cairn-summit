import { useState, useRef } from 'react'
import { ChevronDown, Check, Pencil, Trash2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { SfNetwork } from '@cairn/types'

interface NetworkSelectorProps {
  networks: SfNetwork[]
  selectedNetworkId: string | null
  onSelect: (id: string) => void
  onCreateNetwork: (name: string, abbreviation: string) => Promise<void>
  onUpdateNetwork: (id: string, name: string, abbreviation: string) => Promise<void>
  onDeleteNetwork: (id: string) => Promise<void>
}

type EditState =
  | { type: 'none' }
  | { type: 'rename'; id: string; name: string; abbreviation: string }
  | { type: 'delete'; id: string }
  | { type: 'new'; name: string; abbreviation: string }

function extractNetworkId(sk: string): string {
  return sk.replace(/^SF#NETWORK#/, '')
}

export function NetworkSelector({
  networks,
  selectedNetworkId,
  onSelect,
  onCreateNetwork,
  onUpdateNetwork,
  onDeleteNetwork,
}: NetworkSelectorProps) {
  const [open, setOpen] = useState(false)
  const [editState, setEditState] = useState<EditState>({ type: 'none' })
  const renameInputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  const selectedNetwork = networks.find(n => extractNetworkId(n.sk) === selectedNetworkId)

  function startRename(id: string, currentName: string, currentAbbreviation: string) {
    setEditState({ type: 'rename', id, name: currentName, abbreviation: currentAbbreviation })
    setTimeout(() => renameInputRef.current?.focus(), 0)
  }

  function startDelete(id: string) {
    setEditState({ type: 'delete', id })
  }

  function startNew() {
    setEditState({ type: 'new', name: '', abbreviation: '' })
    setTimeout(() => newInputRef.current?.focus(), 0)
  }

  async function commitRename() {
    if (editState.type !== 'rename') return
    const name = editState.name.trim()
    const abbreviation = editState.abbreviation.trim()
    if (name && abbreviation) await onUpdateNetwork(editState.id, name, abbreviation)
    setEditState({ type: 'none' })
  }

  async function commitDelete() {
    if (editState.type !== 'delete') return
    await onDeleteNetwork(editState.id)
    setEditState({ type: 'none' })
  }

  async function commitNew() {
    if (editState.type !== 'new') return
    const name = editState.name.trim()
    const abbreviation = editState.abbreviation.trim()
    if (name && abbreviation) await onCreateNetwork(name, abbreviation)
    setEditState({ type: 'none' })
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditState({ type: 'none' })
  }

  function handleNewKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditState({ type: 'none' })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm max-w-52">
          <span className="truncate">
            {selectedNetwork
              ? `[${selectedNetwork.abbreviation}] ${selectedNetwork.name}`
              : 'Select network…'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="max-h-72 overflow-y-auto">
          {networks.map(network => {
            const id = extractNetworkId(network.sk)
            const isRenaming = editState.type === 'rename' && editState.id === id
            const isDeleting = editState.type === 'delete' && editState.id === id
            const isSelected = id === selectedNetworkId

            if (isRenaming) {
              return (
                <div key={id} className="px-2 py-1.5 space-y-1">
                  <input
                    ref={renameInputRef}
                    value={editState.name}
                    onChange={e => setEditState({ type: 'rename', id, name: e.target.value, abbreviation: (editState as any).abbreviation })}
                    onKeyDown={handleRenameKeyDown}
                    placeholder="Network name…"
                    className="w-full text-sm bg-transparent outline-none border-b border-border min-w-0 placeholder:text-muted-foreground"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      value={editState.abbreviation}
                      onChange={e => setEditState({ type: 'rename', id, name: (editState as any).name, abbreviation: e.target.value })}
                      onKeyDown={handleRenameKeyDown}
                      placeholder="Abbrev…"
                      className="flex-1 text-sm bg-transparent outline-none border-b border-border min-w-0 placeholder:text-muted-foreground"
                    />
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                      onMouseDown={e => { e.preventDefault(); setEditState({ type: 'none' }) }}>
                      <X className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                      onMouseDown={e => { e.preventDefault(); commitRename() }}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            }

            if (isDeleting) {
              return (
                <div key={id} className="flex items-center gap-1.5 px-2 py-1.5">
                  <span className="text-xs text-muted-foreground flex-1">Remove?</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                    onClick={() => setEditState({ type: 'none' })}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" className="h-6 px-2 text-xs"
                    onClick={commitDelete}>
                    Remove
                  </Button>
                </div>
              )
            }

            return (
              <div
                key={id}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted/60 group ${isSelected ? 'bg-muted/40' : ''}`}
                onClick={() => { onSelect(id); setOpen(false) }}
              >
                {isSelected
                  ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  : <div className="h-3.5 w-3.5 shrink-0" />
                }
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 rounded shrink-0">
                  {network.abbreviation}
                </span>
                <span className="text-sm flex-1 truncate">{network.name}</span>
                <div
                  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-5 w-5"
                    onClick={() => startRename(id, network.name, network.abbreviation)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5"
                    onClick={() => startDelete(id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })}

          {networks.length > 0 && <div className="border-t border-border/50 my-1" />}

          {editState.type === 'new' ? (
            <div className="px-2 py-1.5 space-y-1">
              <input
                ref={newInputRef}
                value={editState.name}
                onChange={e => setEditState({ type: 'new', name: e.target.value, abbreviation: (editState as any).abbreviation })}
                onKeyDown={handleNewKeyDown}
                placeholder="Network name…"
                className="w-full text-sm bg-transparent outline-none border-b border-border min-w-0 placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-1">
                <input
                  value={editState.abbreviation}
                  onChange={e => setEditState({ type: 'new', name: (editState as any).name, abbreviation: e.target.value })}
                  onKeyDown={handleNewKeyDown}
                  placeholder="Abbrev…"
                  className="flex-1 text-sm bg-transparent outline-none border-b border-border min-w-0 placeholder:text-muted-foreground"
                />
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                  onMouseDown={e => { e.preventDefault(); setEditState({ type: 'none' }) }}>
                  <X className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                  onMouseDown={e => { e.preventDefault(); commitNew() }}>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={startNew}
            >
              <Plus className="h-3.5 w-3.5" />
              New Network
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
