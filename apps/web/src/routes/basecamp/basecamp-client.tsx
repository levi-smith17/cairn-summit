import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { ContextBarAddButton } from '@/components/studio/ui/context-bar-add-button'
import { CatalogInspector } from '@/components/studio/catalog/catalog-inspector'
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { useTerminology } from '@/contexts/terminology-context'
import { WaypointForm } from '@/routes/waypoints/waypoint-form'
import {
  BasecampRail,
  WAYPOINT_FILTER_ALL,
  WAYPOINT_UNASSIGNED_TRAIL,
  type BasecampWaypoint,
} from './basecamp-rail'
import {
  BasecampCanvas,
  buildLogbookCards,
  buildManifestSectionCards,
} from './basecamp-canvas'
import type { SnapshotData } from './snapshot-panels'

type InspectorMode = 'waypoint' | 'catalog' | null

interface BasecampClientProps {
  waypoints: BasecampWaypoint[]
  trails: { id: string; name: string }[]
  markers: { id: string; name: string; color: string; icon: string | null }[]
  logs: Array<{
    id: string
    title?: string | null
    content?: string
    trailId?: string | null
    createdAt?: string
    updatedAt?: string
  }>
  sidebarData: SnapshotData & {
    manifestCounts: {
      expeditions: number
      training: number
      gear: number
      landmarks: number
      summits: number
      pathfinding: number
      companions: number
    }
    manifestHighlights: {
      totalYearsExperience: number
      mostRecentExpedition: { title: string; company: string } | null
      mostRecentTraining: { institution: string; degree: string | null } | null
      topGear: { name: string }[]
      mostRecentLandmark?: { name: string } | null
      mostRecentSummit?: { name: string } | null
      mostRecentPathfinding?: { organization: string | null; role: string | null } | null
      mostRecentCompanion?: { name: string } | null
    }
  }
  onRefresh: () => void
}

export function BasecampClient({
  waypoints,
  trails,
  markers,
  logs,
  sidebarData,
  onRefresh,
}: BasecampClientProps) {
  const { terms } = useTerminology()
  const { pinned: inspectorPinned } = useInspectorPin()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterQuery, setFilterQuery] = useState('')
  const [trailFilterId, setTrailFilterId] = useState(WAYPOINT_FILTER_ALL)
  const [markerFilterId, setMarkerFilterId] = useState(WAYPOINT_FILTER_ALL)
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>(null)
  const [inspectorEngaged, setInspectorEngaged] = useState(false)

  const selectedWaypointId = searchParams.get('waypoint')
  const waypointSingular = terms.waypoints.slice(0, -1) || terms.waypoints

  const trailsById = useMemo(
    () => new Map(trails.map((trail) => [trail.id, trail])),
    [trails],
  )

  const filteredWaypoints = useMemo(() => {
    let list = waypoints.map((wp) => ({
      ...wp,
      trailName: wp.trailId ? (trailsById.get(wp.trailId)?.name ?? null) : null,
    }))

    if (trailFilterId === WAYPOINT_UNASSIGNED_TRAIL) {
      list = list.filter((wp) => !wp.trailId)
    } else if (trailFilterId !== WAYPOINT_FILTER_ALL) {
      list = list.filter((wp) => wp.trailId === trailFilterId)
    }

    if (markerFilterId !== WAYPOINT_FILTER_ALL) {
      list = list.filter((wp) =>
        wp.markers.some((m) => m.markerId === markerFilterId || m.marker?.id === markerFilterId),
      )
    }

    const q = filterQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((wp) => {
        const haystack = [
          wp.title,
          wp.url,
          wp.trailName ?? '',
          ...wp.markers.map((m) => m.marker?.name ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    return list
  }, [waypoints, trailsById, trailFilterId, markerFilterId, filterQuery])

  const groups = useMemo(() => {
    const byTrail = new Map<string, BasecampWaypoint[]>()
    for (const waypoint of filteredWaypoints) {
      const label = waypoint.trailName ?? 'Unassigned'
      const bucket = byTrail.get(label) ?? []
      bucket.push(waypoint)
      byTrail.set(label, bucket)
    }
    return [...byTrail.entries()]
      .sort(([left], [right]) => {
        if (left === 'Unassigned') return 1
        if (right === 'Unassigned') return -1
        return left.localeCompare(right)
      })
      .map(([label, items]) => ({
        label,
        waypoints: items.sort((a, b) => (a.title || a.url).localeCompare(b.title || b.url)),
      }))
  }, [filteredWaypoints])

  const selectedWaypoint =
    selectedWaypointId && selectedWaypointId !== 'new'
      ? (waypoints.find((wp) => wp.id === selectedWaypointId) ?? null)
      : null

  const logbooks = useMemo(
    () => buildLogbookCards(logs, trails, 8),
    [logs, trails],
  )

  const manifestSections = useMemo(
    () =>
      buildManifestSectionCards(
        sidebarData.manifestCounts,
        sidebarData.manifestHighlights,
      ),
    [sidebarData.manifestCounts, sidebarData.manifestHighlights],
  )

  const snapshot: SnapshotData = {
    wayfarer: sidebarData.wayfarer,
    provisionsSummary: sidebarData.provisionsSummary,
    itinerarySummary: sidebarData.itinerarySummary,
    signalsSummary: sidebarData.signalsSummary,
  }

  function selectWaypoint(id: string) {
    setInspectorMode('waypoint')
    setInspectorEngaged(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set('waypoint', id)
    setSearchParams(params)
  }

  function showNewWaypoint() {
    selectWaypoint('new')
  }

  const clearSelection = useCallback(() => {
    setInspectorMode(null)
    setInspectorEngaged(false)
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('waypoint')
      return next
    })
  }, [setSearchParams])

  function openCatalog() {
    setInspectorMode('catalog')
    setInspectorEngaged(true)
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('waypoint')
      return next
    })
  }

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (inspectorPinned || !inspectorEngaged) return
      const target = event.target as HTMLElement
      if (target.closest('[data-inspectable]')) return
      clearSelection()
    },
    [inspectorPinned, inspectorEngaged, clearSelection],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && inspectorEngaged) {
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, inspectorEngaged, clearSelection])

  useEffect(() => {
    if (selectedWaypointId) {
      setInspectorMode('waypoint')
      setInspectorEngaged(true)
    }
  }, [selectedWaypointId])

  const showingWaypoint =
    inspectorMode === 'waypoint' && (selectedWaypointId != null || selectedWaypointId === 'new')
  const showingCatalog = inspectorMode === 'catalog'
  const inspectorContentAvailable = showingWaypoint || showingCatalog
  const inspectorOpen = inspectorPinned || (inspectorEngaged && inspectorContentAvailable)
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  const inspectorHint = showingCatalog
    ? `Manage ${terms.trails.toLowerCase()} and ${terms.markers.toLowerCase()}`
    : `Select a ${waypointSingular.toLowerCase()} to edit`

  return (
    <StudioLayout
      railLabel={terms.waypoints}
      contextBar={
        <PlatformStudioContextBar
          aria-label={terms.basecamp}
          title={terms.basecamp}
          subtitle={`${waypoints.length} ${terms.waypoints.toLowerCase()}`}
          showInspectorPin
          actions={
            <ContextBarAddButton
              label={`Add ${waypointSingular.toLowerCase()}`}
              shortLabel={waypointSingular}
              onClick={showNewWaypoint}
            />
          }
        />
      }
      rail={
        <BasecampRail
          groups={groups}
          selectedId={selectedWaypointId}
          filterQuery={filterQuery}
          onFilterQueryChange={setFilterQuery}
          trailFilterId={trailFilterId}
          onTrailFilterChange={setTrailFilterId}
          markerFilterId={markerFilterId}
          onMarkerFilterChange={setMarkerFilterId}
          trails={trails}
          markers={markers}
          onInspect={selectWaypoint}
          onOpenUrl={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
          onOpenCatalog={openCatalog}
        />
      }
      canvas={
        <div className="flex min-h-0 flex-1 flex-col" onPointerDown={handleCanvasPointerDown}>
          <BasecampCanvas
            snapshot={snapshot}
            logbooks={logbooks}
            manifestSections={manifestSections}
          />
        </div>
      }
      inspectorState={inspectorState}
      inspectorHint={inspectorHint}
      inspector={
        showingCatalog ? (
          <CatalogInspector initialTab="trails" onClose={clearSelection} />
        ) : showingWaypoint ? (
          <WaypointForm
            key={selectedWaypointId ?? 'new'}
            waypoint={selectedWaypoint}
            folders={trails}
            tags={markers}
            onBack={clearSelection}
            onSaved={() => {
              onRefresh()
              clearSelection()
            }}
            onDeleted={() => {
              onRefresh()
              clearSelection()
            }}
          />
        ) : inspectorPinned ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="text-sm text-muted-foreground">{inspectorHint}</p>
          </div>
        ) : null
      }
    />
  )
}
