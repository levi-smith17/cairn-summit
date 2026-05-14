import { useState, useMemo } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import type { SfFacility, SfNetwork, SfResource } from '@cairn/types'
import { validateNetwork } from '@/lib/starfield-validation'
import { createNetwork, renameNetwork, deleteNetwork } from '@/lib/api/starfield'
import { StarfieldControlBar } from './starfield-control-bar'
import { StarfieldCanvas } from './starfield-canvas'
import { ResourcesPanel } from './resources-panel'
import { FacilityForm } from './facility-form'

type RightPanelState =
  | { mode: 'closed' }
  | { mode: 'resources' }
  | { mode: 'facility-form'; facilityId: string | null }

interface StarfieldClientProps {
  networks: SfNetwork[]
  facilities: (SfFacility & { id: string })[]
  resources: SfResource[]
  resourceTypes: any[]
  systems: any[]
  onRefresh: () => void
}

export function StarfieldClient({
  networks,
  facilities,
  resources,
  onRefresh,
}: StarfieldClientProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    networks[0] ? networks[0].sk.replace(/^SF#NETWORK#/, '') : null
  )
  const [rightPanel, setRightPanel] = useState<RightPanelState>({ mode: 'closed' })

  const networkFacilities = useMemo(
    () => facilities.filter(f => f.networkId === selectedNetworkId),
    [facilities, selectedNetworkId]
  )

  const validations = useMemo(
    () => validateNetwork(networkFacilities, resources),
    [networkFacilities, resources]
  )

  const showRightPanel = rightPanel.mode !== 'closed'

  function closePanel() {
    setRightPanel({ mode: 'closed' })
  }

  async function handleCreateNetwork(name: string) {
    await createNetwork({ name })
    onRefresh()
  }

  async function handleRenameNetwork(id: string, name: string) {
    await renameNetwork(id, name)
    onRefresh()
  }

  async function handleDeleteNetwork(id: string) {
    await deleteNetwork(id)
    if (selectedNetworkId === id) {
      setSelectedNetworkId(networks.find(n => n.sk.replace(/^SF#NETWORK#/, '') !== id)?.sk.replace(/^SF#NETWORK#/, '') ?? null)
    }
    onRefresh()
  }

  const selectedFacilityId = rightPanel.mode === 'facility-form' ? rightPanel.facilityId : null

  return (
    <ReactFlowProvider>
      <PlatformHeader title="Starfield" />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <StarfieldControlBar
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          onSelectNetwork={setSelectedNetworkId}
          onCreateNetwork={handleCreateNetwork}
          onRenameNetwork={handleRenameNetwork}
          onDeleteNetwork={handleDeleteNetwork}
          onAddFacility={() => setRightPanel({ mode: 'facility-form', facilityId: null })}
          onManageResources={() => setRightPanel({ mode: 'resources' })}
        />

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div
            className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <StarfieldCanvas
              facilities={networkFacilities}
              validations={validations}
              selectedFacilityId={selectedFacilityId}
              onFacilityClick={id => setRightPanel({ mode: 'facility-form', facilityId: id })}
            />
          </div>

          {showRightPanel && (
            <div className="flex flex-col w-full md:w-[420px] shrink-0 rounded-lg border border-border bg-card overflow-hidden">
              {rightPanel.mode === 'resources' && (
                <ResourcesPanel
                  resources={resources}
                  onClose={closePanel}
                  onRefresh={onRefresh}
                />
              )}

              {rightPanel.mode === 'facility-form' && (
                <FacilityForm
                  key={rightPanel.facilityId ?? 'new'}
                  facility={networkFacilities.find(f => f.id === rightPanel.facilityId) ?? undefined}
                  networkId={selectedNetworkId ?? ''}
                  facilities={networkFacilities}
                  onDone={closePanel}
                  onRefresh={onRefresh}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
