import { useState, useMemo } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { toast } from 'sonner'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import type { SfOutpost, SfNetwork, SfResource } from '@cairn/types'
import { validateNetwork } from '@/lib/starfield-validation'
import { createNetwork, updateNetwork, deleteNetwork } from '@/lib/api/starfield'
import { StarfieldControlBar } from './starfield-control-bar'
import { StarfieldCanvas } from './starfield-canvas'
import { ResourcesPanel } from './resources-panel'
import { OutpostForm } from './outpost-form'
import { OutpostResourceForm } from './outpost-resource-form'

type RightPanelState =
  | { mode: 'closed' }
  | { mode: 'resources' }
  | { mode: 'outpost-form'; outpostId: string | null }
  | { mode: 'outpost-resource'; outpostId: string; resourceId: string | null }

interface StarfieldClientProps {
  networks: SfNetwork[]
  outposts: (SfOutpost & { id: string })[]
  resources: SfResource[]
  resourceTypes: any[]
  systems: any[]
  onRefresh: () => void
}

export function StarfieldClient({
  networks,
  outposts,
  resources,
  onRefresh,
}: StarfieldClientProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    networks[0] ? networks[0].sk.replace(/^SF#NETWORK#/, '') : null
  )
  const [rightPanel, setRightPanel] = useState<RightPanelState>({ mode: 'closed' })

  const networkOutposts = useMemo(
    () => outposts.filter(o => o.networkId === selectedNetworkId),
    [outposts, selectedNetworkId]
  )

  const validations = useMemo(
    () => validateNetwork(networkOutposts, resources),
    [networkOutposts, resources]
  )

  const showRightPanel = rightPanel.mode !== 'closed'

  function closePanel() {
    setRightPanel({ mode: 'closed' })
  }

  async function handleCreateNetwork(name: string, abbreviation: string) {
    try {
      await createNetwork({ name, abbreviation })
      onRefresh()
      toast.success(`Network "${name}" created.`)
    } catch {
      toast.error('Failed to create network.')
    }
  }

  async function handleUpdateNetwork(id: string, name: string, abbreviation: string) {
    try {
      await updateNetwork(id, { name, abbreviation })
      onRefresh()
      toast.success(`Network updated.`)
    } catch {
      toast.error('Failed to update network.')
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

  const selectedOutpostId =
    rightPanel.mode === 'outpost-form' || rightPanel.mode === 'outpost-resource'
      ? rightPanel.outpostId
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
          onUpdateNetwork={handleUpdateNetwork}
          onDeleteNetwork={handleDeleteNetwork}
          onAddOutpost={() => setRightPanel({ mode: 'outpost-form', outpostId: null })}
          onManageResources={() => setRightPanel({ mode: 'resources' })}
        />

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div
            className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <StarfieldCanvas
              outposts={networkOutposts}
              validations={validations}
              selectedOutpostId={selectedOutpostId}
              onOutpostClick={id => setRightPanel({ mode: 'outpost-form', outpostId: id })}
              onAddOutpostResource={id => setRightPanel({ mode: 'outpost-resource', outpostId: id, resourceId: null })}
              onEditOutpostResource={(outpostId, resourceId) =>
                setRightPanel({ mode: 'outpost-resource', outpostId, resourceId })
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

              {rightPanel.mode === 'outpost-form' && (
                <OutpostForm
                  key={rightPanel.outpostId ?? 'new'}
                  outpost={networkOutposts.find(o => o.id === rightPanel.outpostId) ?? undefined}
                  networkId={selectedNetworkId ?? ''}
                  outposts={networkOutposts}
                  onDone={closePanel}
                  onRefresh={onRefresh}
                />
              )}

              {rightPanel.mode === 'outpost-resource' && (
                <div className="flex flex-col h-full">
                  <OutpostResourceForm
                    key={`${rightPanel.outpostId}-${rightPanel.resourceId ?? 'new'}`}
                    outpostId={rightPanel.outpostId}
                    resourceId={rightPanel.resourceId}
                    resources={resources}
                    outposts={networkOutposts}
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
