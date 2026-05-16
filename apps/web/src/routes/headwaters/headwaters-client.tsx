import { useMemo, useCallback, useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
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

export function HeadwatersClient({ kins, wayfarerSeedId, onRefresh, panel, onSetPanel }: HeadwatersClientProps) {
  const { terms } = useTerminology()
  const [searchQuery, setSearchQuery] = useState('')
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

  const handleQuickParentFix = useCallback(async (kinId: string, update: ParentUpdate) => {
    const kin = kinsWithId.find(k => k.id === kinId)
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
  }, [kinsWithId, onRefresh])

  return (
    <ReactFlowProvider>
      <PlatformHeader title={terms.headwaters} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={`${terms.explore} ${terms.kin_plural.toLowerCase()}…`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`pl-7 h-8 text-sm ${searchQuery ? 'pr-7' : ''}`}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-sm shrink-0"
              onClick={() => onSetPanel({ mode: 'kin-form', kinId: null })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add {terms.kin}
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
              searchQuery={searchQuery}
              onKinClick={id => onSetPanel({ mode: 'kin-form', kinId: id })}
              onQuickParentFix={handleQuickParentFix}
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
