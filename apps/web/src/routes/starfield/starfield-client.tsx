import { useState, useMemo } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { toast } from 'sonner'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import type { SfFacility, SfNetwork, SfResource } from '@cairn/types'
import { validateNetwork } from '@/lib/starfield-validation'
import { createNetwork, renameNetwork, deleteNetwork } from '@/lib/api/starfield'
import { StarfieldControlBar } from './starfield-control-bar'
import { StarfieldCanvas } from './starfield-canvas'
import { ResourcesPanel } from './resources-panel'
import { FacilityForm } from './facility-form'
import { FacilityResourceForm } from './facility-resource-form'

type RightPanelState =
  | { mode: 'closed' }
  | { mode: 'resources' }
  | { mode: 'facility-form'; facilityId: string | null }
  | { mode: 'facility-resource'; facilityId: string; resourceId: string | null }

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
    try {
      await createNetwork({ name })
      onRefresh()
      toast.success(`Network "${name}" created.`)
    } catch {
      toast.error('Failed to create network.')
    }
  }

  async function handleRenameNetwork(id: string, name: string) {
    try {
      await renameNetwork(id, name)
      onRefresh()
      toast.success(`Network renamed to "${name}".`)
    } catch {
      toast.error('Failed to rename network.')
    }
  }

  async function handleDeleteNetwork(id: string) {
    try {
      await deleteNetwork(id)
      if (selectedNetworkId === id) {
        setSelectedNetworkId(
          networks.find(n => n.sk.replace(/^SF#NETWORK#/, '') !== id)?.sk.replace(/^SF#NETWORK#/, '') ?? null
        )
      }
      onRefresh()
      toast.success('Network deleted.')
    } catch {
      toast.error('Failed to delete network.')
    }
  }

  const selectedFacilityId =
    rightPanel.mode === 'facility-form' || rightPanel.mode === 'facility-resource'
      ? rightPanel.facilityId
      : null

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
              onAddFacilityResource={id => setRightPanel({ mode: 'facility-resource', facilityId: id, resourceId: null })}
              onEditFacilityResource={(facilityId, resourceId) =>
                setRightPanel({ mode: 'facility-resource', facilityId, resourceId })
              }
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

              {rightPanel.mode === 'facility-resource' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
                    <span className="text-sm font-medium">
                      {rightPanel.resourceId ? 'Edit Resource' : 'Add Resource'}
                    </span>
                  </div>
                  <FacilityResourceForm
                    key={`${rightPanel.facilityId}-${rightPanel.resourceId ?? 'new'}`}
                    facilityId={rightPanel.facilityId}
                    resourceId={rightPanel.resourceId}
                    resources={resources}
                    facilities={networkFacilities}
                    onDone={closePanel}
                    onRefresh={onRefresh}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
