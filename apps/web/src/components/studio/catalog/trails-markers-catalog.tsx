import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterInput } from '@/components/ui/filter-input'
import { ContextTabButton } from '@/components/studio/ui/context-tab'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { TrailForm } from '@/routes/trails/trail-form'
import { MarkerForm } from '@/routes/markers/marker-form'
import { MarkerList, type SubmarkerParent } from '@/routes/markers/marker-list'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'

export type CatalogTab = 'trails' | 'markers'

export type CatalogSelection = {
  tab: CatalogTab
  selectedId: string | null
}

/** Shared Trails/Markers catalog inspector used by Basecamp, Logs, and other studio rails. */
export function TrailsMarkersCatalog({
  activeTab,
  onTabChange,
  trails,
  markers,
  selectedId,
  onSelectId,
  onClearSelection,
}: {
  activeTab: CatalogTab
  onTabChange: (tab: CatalogTab) => void
  trails: { id: string; name: string }[]
  markers: { id: string; name: string; color: string; icon: string | null; _count?: { waypoints: number } }[]
  selectedId: string | null
  onSelectId: (id: string | null) => void
  onClearSelection: () => void
}) {
  const { terms } = useTerminology()
  const [markerSearch, setMarkerSearch] = useState('')
  const [markerGroupPath, setMarkerGroupPath] = useState<string[]>([])
  const [parentMarker, setParentMarker] = useState<SubmarkerParent | null>(null)

  const sortedTrails = useMemo(
    () => [...trails].sort((a, b) => a.name.localeCompare(b.name)),
    [trails],
  )

  const selectedTrail =
    activeTab === 'trails' && selectedId && selectedId !== 'new'
      ? (trails.find((t) => t.id === selectedId) ?? null)
      : null
  const isNewTrail = activeTab === 'trails' && selectedId === 'new'

  const selectedMarker =
    activeTab === 'markers' && selectedId && selectedId !== 'new'
      ? (markers.find((m) => m.id === selectedId) ?? null)
      : null
  const isNewMarker = activeTab === 'markers' && selectedId === 'new'

  const showEditor =
    (activeTab === 'trails' && (selectedTrail || isNewTrail)) ||
    (activeTab === 'markers' && (selectedMarker || isNewMarker))

  function handleTabChange(tab: CatalogTab) {
    setParentMarker(null)
    setMarkerSearch('')
    setMarkerGroupPath([])
    onTabChange(tab)
  }

  function clearMarkerSelection() {
    setParentMarker(null)
    onClearSelection()
  }

  if (showEditor) {
    if (activeTab === 'trails') {
      return (
        <TrailForm
          key={selectedId ?? 'new'}
          trail={selectedTrail}
          onBack={onClearSelection}
          onSaved={(id) => onSelectId(id)}
          onDeleted={onClearSelection}
        />
      )
    }
    return (
      <MarkerForm
        key={`${selectedId ?? 'new'}-${parentMarker?.name ?? ''}`}
        tag={selectedMarker}
        parentMarker={parentMarker}
        onBack={clearMarkerSelection}
        onSaved={(id) => {
          setParentMarker(null)
          onSelectId(id)
        }}
        onDeleted={clearMarkerSelection}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex h-14 shrink-0 border-b border-border" aria-label="Catalog">
        <ContextTabButton
          active={activeTab === 'trails'}
          onClick={() => handleTabChange('trails')}
          className="flex-1 justify-center text-xs"
        >
          {terms.trails}
        </ContextTabButton>
        <ContextTabButton
          active={activeTab === 'markers'}
          onClick={() => handleTabChange('markers')}
          className="flex-1 justify-center text-xs"
        >
          {terms.markers}
        </ContextTabButton>
      </nav>

      {activeTab === 'trails' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">{sortedTrails.length} total</span>
            <ToolbarTooltip label={`New ${terms.trails.slice(0, -1).toLowerCase()}`}>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={() => onSelectId('new')}
                aria-label={`New ${terms.trails.slice(0, -1).toLowerCase()}`}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </ToolbarTooltip>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sortedTrails.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground">
                No {terms.trails.toLowerCase()} yet.
              </p>
            ) : (
              <ul>
                {sortedTrails.map((trail) => (
                  <li key={trail.id}>
                    <button
                      type="button"
                      onClick={() => onSelectId(trail.id)}
                      className={cn(
                        'flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted-hover',
                        selectedId === trail.id && 'bg-primary/10 text-primary',
                      )}
                    >
                      <span className="truncate font-medium">{trail.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-3 py-2">
            <FilterInput
              value={markerSearch}
              onChange={setMarkerSearch}
              placeholder={`Filter ${terms.markers.toLowerCase()}…`}
            />
          </div>
          <MarkerList
            markers={markers}
            search={markerSearch}
            groupPath={markerGroupPath}
            selectedId={selectedId}
            onSelect={(id) => {
              setParentMarker(null)
              onSelectId(id)
            }}
            onNew={() => {
              setParentMarker(null)
              onSelectId('new')
            }}
            onNewSubmarker={(parent) => {
              setParentMarker(parent)
              onSelectId('new')
            }}
            onNavigateInto={setMarkerGroupPath}
          />
        </div>
      )}
    </div>
  )
}
