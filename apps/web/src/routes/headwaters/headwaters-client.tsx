import { useMemo } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { extractId } from '@/lib/utils'
import type { Kin } from '@cairn/types'
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

export function HeadwatersClient({ kins, wayfarerSeedId, onRefresh, panel, onSetPanel }: HeadwatersClientProps) {
  const kinsWithId = useMemo(
    () => kins.map(k => ({ ...k, id: extractId(k.sk) })),
    [kins]
  )

  const showPanel = panel.mode !== 'closed'
  const selectedKinId = panel.mode === 'kin-form' ? panel.kinId : null

  function closePanel() {
    onSetPanel({ mode: 'closed' })
  }

  const activeKin = panel.mode === 'kin-form' && panel.kinId
    ? kinsWithId.find(k => k.id === panel.kinId)
    : undefined

  const isWayfarerSeed = panel.mode === 'kin-form' && panel.kinId === wayfarerSeedId

  return (
    <ReactFlowProvider>
      <PlatformHeader title="Headwaters" />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-sm"
              onClick={() => onSetPanel({ mode: 'kin-form', kinId: null })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Kin
            </Button>
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div
            className={`${showPanel ? 'hidden md:flex' : 'flex'} flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <HeadwatersCanvas
              kins={kinsWithId}
              selectedKinId={selectedKinId}
              onKinClick={id => onSetPanel({ mode: 'kin-form', kinId: id })}
              wayfarerSeedId={wayfarerSeedId}
            />
          </div>

          {showPanel && (
            <div className="flex flex-col w-full md:w-[420px] shrink-0 rounded-lg border border-border bg-card overflow-hidden">
              {panel.mode === 'kin-form' && (
                <KinForm
                  key={panel.kinId ?? 'new'}
                  kin={activeKin}
                  isNew={isWayfarerSeed}
                  allKin={kinsWithId}
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
