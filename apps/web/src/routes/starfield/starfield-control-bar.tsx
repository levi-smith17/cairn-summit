import { Plus, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SfNetwork } from '@cairn/types'
import { NetworkSelector } from './network-selector'

interface StarfieldControlBarProps {
  networks: SfNetwork[]
  selectedNetworkId: string | null
  onSelectNetwork: (id: string) => void
  onCreateNetwork: (name: string, abbreviation: string) => Promise<void>
  onUpdateNetwork: (id: string, name: string, abbreviation: string) => Promise<void>
  onDeleteNetwork: (id: string) => Promise<void>
  onAddOutpost: () => void
  onManageResources: () => void
}

export function StarfieldControlBar({
  networks,
  selectedNetworkId,
  onSelectNetwork,
  onCreateNetwork,
  onUpdateNetwork,
  onDeleteNetwork,
  onAddOutpost,
  onManageResources,
}: StarfieldControlBarProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <NetworkSelector
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          onSelect={onSelectNetwork}
          onCreateNetwork={onCreateNetwork}
          onUpdateNetwork={onUpdateNetwork}
          onDeleteNetwork={onDeleteNetwork}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={onAddOutpost}
          disabled={!selectedNetworkId}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Outpost
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={onManageResources}
        >
          <Boxes className="h-3.5 w-3.5" />
          Resources
        </Button>
      </div>
    </div>
  )
}
