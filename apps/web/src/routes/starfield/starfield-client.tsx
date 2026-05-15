import { useState, useMemo, useCallback, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { toast } from 'sonner'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import type { SfOutpost, SfNetwork, SfResource } from '@cairn/types'
import { validateNetwork } from '@/lib/starfield-validation'
import {
  createNetwork, updateNetwork, deleteNetwork,
  createSystem, updateSystem, deleteSystem,
  addPlanet, updatePlanet, deletePlanet,
} from '@/lib/api/starfield'
import { StarfieldControlBar } from './starfield-control-bar'
import { StarfieldCanvas } from './starfield-canvas'
import { ResourcesPanel } from './resources-panel'
import { SystemsPanel } from './systems-panel'
import { OutpostForm } from './outpost-form'
import { OutpostResourceForm } from './outpost-resource-form'

type RightPanelState =
  | { mode: 'closed' }
  | { mode: 'resources' }
  | { mode: 'systems' }
  | { mode: 'outpost-form'; outpostId: string | null }
  | { mode: 'outpost-resource'; outpostId: string; resourceId: string | null }

interface SystemEntry {
  id: string
  name: string
  planets: { id: string; name: string }[]
}

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
  systems: systemsProp,
  onRefresh,
}: StarfieldClientProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    networks[0] ? networks[0].sk.replace(/^SF#NETWORK#/, '') : null
  )
  const [rightPanel, setRightPanel] = useState<RightPanelState>({ mode: 'closed' })

  // Global systems state — initialized from API data, updated optimistically
  const [localSystems, setLocalSystems] = useState<SystemEntry[]>(() =>
    (systemsProp ?? []).map((s: any) => ({
      id: s.sk?.replace(/^SYSTEM#/, '') ?? s.id,
      name: s.name,
      planets: s.planets ?? [],
    }))
  )

  useEffect(() => {
    setLocalSystems((systemsProp ?? []).map((s: any) => ({
      id: s.sk?.replace(/^SYSTEM#/, '') ?? s.id,
      name: s.name,
      planets: s.planets ?? [],
    })))
  }, [systemsProp])

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

  // ── Network CRUD ─────────────────────────────────────────────────────────────

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
      toast.success('Network removed.')
    } catch {
      toast.error('Failed to remove network.')
    }
  }

  // ── System CRUD (optimistic local update + background API) ───────────────────

  const handleSystemCreate = useCallback((name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    setLocalSystems(prev => [...prev, { id, name, planets: [] }])
    createSystem(name).catch(() => toast.error('Failed to save system.'))
  }, [])

  const handleSystemRename = useCallback((id: string, newName: string) => {
    setLocalSystems(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s))
    updateSystem(id, newName).catch(() => toast.error('Failed to update system.'))
  }, [])

  const handleSystemDelete = useCallback((id: string) => {
    setLocalSystems(prev => prev.filter(s => s.id !== id))
    deleteSystem(id).catch(() => toast.error('Failed to remove system.'))
  }, [])

  const handlePlanetCreate = useCallback((systemId: string, name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    setLocalSystems(prev => prev.map(s =>
      s.id === systemId ? { ...s, planets: [...s.planets, { id, name }] } : s
    ))
    addPlanet(systemId, name).catch(() => toast.error('Failed to save planet.'))
  }, [])

  const handlePlanetRename = useCallback((systemId: string, planetId: string, newName: string) => {
    setLocalSystems(prev => prev.map(s =>
      s.id === systemId
        ? { ...s, planets: s.planets.map(p => p.id === planetId ? { id: newName.toLowerCase().replace(/\s+/g, '-'), name: newName } : p) }
        : s
    ))
    updatePlanet(systemId, planetId, newName).catch(() => toast.error('Failed to update planet.'))
  }, [])

  const handlePlanetDelete = useCallback((systemId: string, planetId: string) => {
    setLocalSystems(prev => prev.map(s =>
      s.id === systemId ? { ...s, planets: s.planets.filter(p => p.id !== planetId) } : s
    ))
    deletePlanet(systemId, planetId).catch(() => toast.error('Failed to remove planet.'))
  }, [])

  // Called by PlanetPicker's onSystemsUpdate (local picker state sync)
  const handleSystemsUpdate = useCallback((pickerSystems: { id: string; name: string; planets: { id: string; name: string }[] }[]) => {
    setLocalSystems(pickerSystems)
  }, [])

  const systemCrudCallbacks = useMemo(() => ({
    onSystemCreate: handleSystemCreate,
    onSystemRename: handleSystemRename,
    onSystemDelete: handleSystemDelete,
    onPlanetCreate: handlePlanetCreate,
    onPlanetRename: handlePlanetRename,
    onPlanetDelete: handlePlanetDelete,
  }), [handleSystemCreate, handleSystemRename, handleSystemDelete, handlePlanetCreate, handlePlanetRename, handlePlanetDelete])

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
          onManageSystems={() => setRightPanel({ mode: 'systems' })}
        />

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div
            className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <StarfieldCanvas
              outposts={networkOutposts}
              resources={resources}
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

              {rightPanel.mode === 'systems' && (
                <SystemsPanel
                  systems={localSystems}
                  onClose={closePanel}
                  onSystemCreate={handleSystemCreate}
                  onSystemRename={handleSystemRename}
                  onSystemDelete={handleSystemDelete}
                  onPlanetCreate={handlePlanetCreate}
                  onPlanetRename={handlePlanetRename}
                  onPlanetDelete={handlePlanetDelete}
                />
              )}

              {rightPanel.mode === 'outpost-form' && (
                <OutpostForm
                  key={rightPanel.outpostId ?? 'new'}
                  outpost={networkOutposts.find(o => o.id === rightPanel.outpostId) ?? undefined}
                  networkId={selectedNetworkId ?? ''}
                  outposts={networkOutposts}
                  systems={localSystems}
                  onSystemsUpdate={handleSystemsUpdate}
                  systemCrudCallbacks={systemCrudCallbacks}
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
                    systems={localSystems}
                    onSystemsUpdate={handleSystemsUpdate}
                    systemCrudCallbacks={systemCrudCallbacks}
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
