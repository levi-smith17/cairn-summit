import { Plus, Boxes, Maximize2 } from 'lucide-react'
import { useReactFlow } from 'reactflow'
import { Button } from '@/components/ui/button'
import type { SfNetwork } from '@cairn/types'
import { NetworkSelector } from './network-selector'

interface StarfieldControlBarProps {
  networks: SfNetwork[]
  selectedNetworkId: string | null
  onSelectNetwork: (id: string) => void
  onCreateNetwork: (name: string) => Promise<void>
  onRenameNetwork: (id: string, name: string) => Promise<void>
  onDeleteNetwork: (id: string) => Promise<void>
  onAddFacility: () => void
  onManageResources: () => void
}

export function StarfieldControlBar({
  networks,
  selectedNetworkId,
  onSelectNetwork,
  onCreateNetwork,
  onRenameNetwork,
  onDeleteNetwork,
  onAddFacility,
  onManageResources,
}: StarfieldControlBarProps) {
  const { fitView } = useReactFlow()

  return (
    <div className="rounded-lg border border-border bg-card p-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <NetworkSelector
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          onSelect={onSelectNetwork}
          onCreateNetwork={onCreateNetwork}
          onRenameNetwork={onRenameNetwork}
          onDeleteNetwork={onDeleteNetwork}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={onAddFacility}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Facility
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
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          onClick={() => fitView({ padding: 0.1 })}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Fit View
        </Button>
      </div>
    </div>
  )
}
