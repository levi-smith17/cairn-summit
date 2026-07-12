import { useMemo, useCallback, useState, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { StudioDataToolbar } from '@/components/studio/layout/studio-data-toolbar'
import { ContextBarAddButton } from '@/components/studio/ui/context-bar-add-button'
import { FilterInput } from '@/components/ui/filter-input'
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { extractId } from '@/lib/utils'
import { updateKin } from '@/lib/api/headwaters'
import { useTerminology } from '@/contexts/terminology-context'
import type { Kin } from '@cairn/types'
import type { ParentUpdate } from './kin-node'
import { HeadwatersCanvas } from './headwaters-canvas'
import { KinForm } from './kin-form'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'kin-form'; kinId: string | null }

interface HeadwatersClientProps {
  kins: Kin[]
  wayfarerSeedId: string | null
  onRefresh: () => void
  panel: PanelState
  onSetPanel: (panel: PanelState) => void
}

export function HeadwatersClient({
  kins,
  wayfarerSeedId,
  onRefresh,
  panel,
  onSetPanel,
}: HeadwatersClientProps) {
  const { terms } = useTerminology()
  const { pinned: inspectorPinned } = useInspectorPin()
  const [searchQuery, setSearchQuery] = useState('')

  const kinsWithId = useMemo(
    () => kins.map((k) => ({ ...k, id: extractId(k.sk) })),
    [kins],
  )

  const selectedKinId = panel.mode === 'kin-form' ? panel.kinId : null
  const inspectorOpen = inspectorPinned || panel.mode !== 'closed'
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  function closePanel() {
    onSetPanel({ mode: 'closed' })
  }

  function openNew() {
    onSetPanel({ mode: 'kin-form', kinId: null })
  }

  const activeKin =
    panel.mode === 'kin-form' && panel.kinId
      ? kinsWithId.find((k) => k.id === panel.kinId)
      : undefined

  const isWayfarerSeed = panel.mode === 'kin-form' && panel.kinId === wayfarerSeedId

  const handleQuickParentFix = useCallback(
    async (kinId: string, update: ParentUpdate) => {
      const kin = kinsWithId.find((k) => k.id === kinId)
      if (!kin) return
      await updateKin(kinId, {
        givenName: kin.givenName,
        middleName: kin.middleName,
        nickname: kin.nickname,
        surname: kin.surname,
        birthDate: kin.birthDate,
        deathDate: kin.deathDate,
        fatherId: update.fatherId,
        fatherUnknown: update.fatherUnknown,
        motherId: update.motherId,
        motherUnknown: update.motherUnknown,
        bloodlines: kin.bloodlines,
      })
      onRefresh()
    },
    [kinsWithId, onRefresh],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && panel.mode !== 'closed') {
        closePanel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, panel.mode])

  return (
    <ReactFlowProvider>
      <StudioLayout
        railLabel={terms.kin_plural}
        inspectorWidth={380}
        contextBar={
          <PlatformStudioContextBar
            aria-label={`${terms.headwaters} header`}
            title={terms.headwaters}
            subtitle={`${kinsWithId.length} ${kinsWithId.length === 1 ? terms.kin : terms.kin_plural}`.toLowerCase()}
            showInspectorPin
            actions={<ContextBarAddButton label={`Add ${terms.kin}`} onClick={openNew} />}
          />
        }
        canvas={
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <StudioDataToolbar
              trailing={
                <FilterInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Filter ${terms.kin_plural.toLowerCase()}…`}
                  className="w-full max-w-xs"
                />
              }
            />
            <div className="min-h-0 flex-1 overflow-hidden" data-inspectable>
              <HeadwatersCanvas
                kins={kinsWithId}
                selectedKinId={selectedKinId}
                searchQuery={searchQuery}
                onKinClick={(id) => onSetPanel({ mode: 'kin-form', kinId: id })}
                onQuickParentFix={handleQuickParentFix}
                onPaneClick={() => {
                  if (!inspectorPinned) closePanel()
                }}
              />
            </div>
          </div>
        }
        inspectorState={inspectorState}
        inspectorHint={`Select a ${terms.kin.toLowerCase()} to edit, or add a new one`}
        inspector={
          panel.mode === 'kin-form' ? (
            <KinForm
              key={panel.kinId ?? 'new'}
              kin={activeKin}
              isNew={Boolean(isWayfarerSeed)}
              allKin={kinsWithId}
              onDone={closePanel}
              onRefresh={onRefresh}
            />
          ) : inspectorPinned ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inspector
                </p>
              </div>
              <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
                Select a {terms.kin.toLowerCase()} to edit, or add a new one from the toolbar.
              </p>
            </div>
          ) : null
        }
      />
    </ReactFlowProvider>
  )
}
