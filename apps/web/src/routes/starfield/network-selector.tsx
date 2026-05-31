import { useState } from 'react'
import { ChevronDown, Check, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { SfNetwork } from '@cairn/types'
import { NetworkForm } from './network-form'
import { SF_CONTROL, SF_ICON_CONTROL } from './constants'

interface NetworkSelectorProps {
  networks: SfNetwork[]
  selectedNetworkId: string | null
  onSelect: (id: string) => void
  onCreateNetwork: (name: string, abbreviation: string) => Promise<void>
  onUpdateNetwork: (id: string, name: string, abbreviation: string) => Promise<void>
  onDeleteNetwork: (id: string) => Promise<void>
}

type ViewMode =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; id: string; name: string; abbreviation: string }
  | { mode: 'delete'; id: string; name: string }

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
  const [view, setView] = useState<ViewMode>({ mode: 'list' })

  const selectedNetwork = networks.find(n => extractNetworkId(n.sk) === selectedNetworkId)

  function closeForm() {
    setView({ mode: 'list' })
  }

  async function handleSave(name: string, abbreviation: string) {
    if (view.mode === 'create') {
      await onCreateNetwork(name, abbreviation)
    } else if (view.mode === 'edit') {
      await onUpdateNetwork(view.id, name, abbreviation)
    }
    closeForm()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={isOpen => {
      setOpen(isOpen)
      if (!isOpen) setView({ mode: 'list' })
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`${SF_CONTROL} gap-1.5 text-sm md:max-w-52 w-full justify-between`}>
          <span className="truncate">
            {selectedNetwork
              ? `[${selectedNetwork.abbreviation}] ${selectedNetwork.name}`
              : 'Select network…'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="start">
        {view.mode === 'create' || view.mode === 'edit' ? (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Button type="button" variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={closeForm}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {view.mode === 'create' ? 'New Network' : 'Edit Network'}
              </span>
            </div>
            <NetworkForm
              key={view.mode === 'edit' ? view.id : 'new'}
              network={view.mode === 'edit' ? { id: view.id, name: view.name, abbreviation: view.abbreviation } : undefined}
              onSave={handleSave}
              onCancel={closeForm}
            />
          </div>
        ) : view.mode === 'delete' ? (
          <div className="p-4 space-y-4">
            <p className="text-sm">
              Remove network <span className="font-medium">&quot;{view.name}&quot;</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className={SF_CONTROL} onClick={closeForm}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className={SF_CONTROL}
                onClick={async () => {
                  await onDeleteNetwork(view.id)
                  closeForm()
                  setOpen(false)
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto p-1">
            {networks.map(network => {
              const id = extractNetworkId(network.sk)
              const isSelected = id === selectedNetworkId
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
                    className="flex items-center gap-0.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={SF_ICON_CONTROL}
                      onClick={() => setView({
                        mode: 'edit',
                        id,
                        name: network.name,
                        abbreviation: network.abbreviation,
                      })}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={SF_ICON_CONTROL}
                      onClick={() => setView({ mode: 'delete', id, name: network.name })}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {networks.length > 0 && <div className="border-t border-border/50 my-1" />}

            <button
              type="button"
              className={`flex items-center gap-2 w-full px-2 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors ${SF_CONTROL}`}
              onClick={() => setView({ mode: 'create' })}
            >
              <Plus className="h-3.5 w-3.5" />
              New Network
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
