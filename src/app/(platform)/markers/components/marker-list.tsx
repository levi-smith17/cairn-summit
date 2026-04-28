'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Tag } from 'lucide-react'
import * as lucide from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'
import {
  buildMarkerTree,
  getNodesAtPath,
  getAllLeafIds,
  getAllLeaves,
  type MarkerTreeNode,
  type MarkerGroup,
  type MarkerLeaf,
} from '@/lib/marker-groups'

interface MarkerItem {
  id: string
  name: string
  color: string
  icon: string | null
  _count: { waypoints: number }
}

export interface SubmarkerParent {
  name: string
  color: string
  icon: string | null
}

interface MarkerListProps {
  markers: MarkerItem[]
  /** Current search query — when set, shows flat global results */
  search: string
  /** Current drill-down path segments */
  groupPath: string[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onNewSubmarker: (parent: SubmarkerParent) => void
  /** Navigate into a group by its full path */
  onNavigateInto: (path: string[]) => void
}

// ── Row: real marker (leaf or group+leaf) ────────────────────────────────────

function MarkerRow({
  id,
  label,
  color,
  icon,
  waypointCount,
  isSelected,
  hasDrillIn,
  currentPath,
  onSelect,
  onDrillIn,
  onAdd,
  addLabel,
}: {
  id: string
  label: string
  color: string
  icon: string | null
  waypointCount: number
  isSelected: boolean
  hasDrillIn: boolean
  currentPath: string[]
  onSelect: () => void
  onDrillIn?: () => void
  onAdd: () => void
  addLabel: string
}) {
  const Icon = icon ? (lucide as any)[icon] as lucide.LucideIcon | undefined : null

  return (
    <div
      className={`group flex items-center gap-2 px-4 py-2.5 border-b transition-colors ${
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50 cursor-pointer'
      }`}
      onClick={!hasDrillIn ? onSelect : undefined}
    >
      {/* Color dot */}
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />

      {/* Icon */}
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />}

      {/* Label — clickable to select when row is group+leaf (drill-in is separate) */}
      <button
        type="button"
        onClick={hasDrillIn ? onSelect : undefined}
        className={`flex-1 text-left text-sm truncate ${hasDrillIn ? 'hover:opacity-70 transition-opacity' : ''}`}
      >
        {label}
      </button>

      {/* Waypoint count */}
      {waypointCount > 0 && (
        <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0">
          {waypointCount}
        </span>
      )}

      {/* Add sub-marker (hover) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAdd() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{addLabel}</TooltipContent>
      </Tooltip>

      {/* Drill-in chevron — only for group+leaf */}
      {hasDrillIn && onDrillIn && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDrillIn() }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Open group</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// ── Row: structural group (no real marker at this level) ─────────────────────

function GroupRow({
  label,
  currentPath,
  onDrillIn,
  onAdd,
  addLabel,
}: {
  label: string
  currentPath: string[]
  onDrillIn: () => void
  onAdd: () => void
  addLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onDrillIn}
      className="group flex items-center gap-2 w-full px-4 py-2.5 border-b text-left transition-colors hover:bg-muted/50"
    >
      {/* Placeholder dot — neutral, since no real marker */}
      <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30" />

      <span className="flex-1 text-sm font-medium truncate">{label}</span>

      {/* Add sub-marker (hover) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onAdd() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{addLabel}</TooltipContent>
      </Tooltip>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </button>
  )
}

// ── Flat search result row ───────────────────────────────────────────────────

function SearchResultRow({
  marker,
  isSelected,
  onSelect,
  onAdd,
  addLabel,
}: {
  marker: MarkerItem
  isSelected: boolean
  onSelect: () => void
  onAdd: () => void
  addLabel: string
}) {
  const Icon = marker.icon ? (lucide as any)[marker.icon] as lucide.LucideIcon | undefined : null
  const segments = marker.name.split('/')
  const label = segments[segments.length - 1]
  const parentPath = segments.slice(0, -1).join(' / ')

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 px-4 py-2.5 border-b transition-colors cursor-pointer ${
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: marker.color }} />
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: marker.color }} />}

      <div className="flex-1 min-w-0">
        {parentPath && (
          <p className="text-[10px] text-muted-foreground/60 truncate">{parentPath}</p>
        )}
        <p className="text-sm truncate">{label}</p>
      </div>

      {marker._count.waypoints > 0 && (
        <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0">
          {marker._count.waypoints}
        </span>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAdd() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{addLabel}</TooltipContent>
      </Tooltip>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function MarkerList({
  markers,
  search,
  groupPath,
  selectedId,
  onSelect,
  onNew,
  onNewSubmarker,
  onNavigateInto,
}: MarkerListProps) {
  const { terms } = useTerminology()

  const tree = useMemo(() => buildMarkerTree(markers), [markers])
  const markerMap = useMemo(() => new Map(markers.map(m => [m.id, m])), [markers])

  // Nodes at the current drill-down level
  const currentNodes = useMemo(() => getNodesAtPath(tree, groupPath), [tree, groupPath])

  // Global flat leaves for search
  const allLeaves = useMemo(() => getAllLeaves(tree), [tree])

  const isSearching = search.trim().length > 0

  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const q = search.toLowerCase()
    return allLeaves
      .map(({ leaf }) => markerMap.get(leaf.id))
      .filter((m): m is MarkerItem =>
        !!m && m.name.toLowerCase().includes(q)
      )
  }, [allLeaves, markerMap, search, isSearching])

  const addLabel = `Add sub-${terms.markers.slice(0, -1).toLowerCase()}`

  // Real marker at the current group path (for inheriting color/icon in sub-marker creation)
  const currentGroupMarker = groupPath.length > 0
    ? markers.find(m => m.name === groupPath.join('/')) ?? null
    : null

  // Context-aware count:
  //   searching → result count
  //   root      → total marker count
  //   in group  → count of real markers in this group's subtree
  const groupMarkerCount = useMemo(
    () => getAllLeafIds(currentNodes).length,
    [currentNodes]
  )
  const markerSingular = terms.markers.slice(0, -1).toLowerCase()
  const markerPlural   = terms.markers.toLowerCase()
  const countLabel = isSearching
    ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
    : groupPath.length === 0
      ? `${markers.length} ${markers.length !== 1 ? markerPlural : markerSingular}`
      : `${groupMarkerCount} ${groupMarkerCount !== 1 ? markerPlural : markerSingular} in ${groupPath[groupPath.length - 1]}`

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header — consistent with Waypoints/Logs ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        {/* Back button — only shown when inside a group */}
        {groupPath.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onNavigateInto(groupPath.slice(0, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to {groupPath.length === 1 ? `all ${terms.markers.toLowerCase()}` : groupPath[groupPath.length - 2]}</TooltipContent>
          </Tooltip>
        )}

        <span className="text-sm font-medium flex-1">{countLabel}</span>

        {/* Add button — adds marker at root, sub-marker inside a group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                if (groupPath.length === 0) {
                  onNew()
                } else {
                  onNewSubmarker({
                    name: groupPath.join('/'),
                    color: currentGroupMarker?.color ?? '#6b7280',
                    icon: currentGroupMarker?.icon ?? null,
                  })
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {groupPath.length === 0
              ? `Add ${terms.markers.slice(0, -1).toLowerCase()}`
              : `Add sub-${terms.markers.slice(0, -1).toLowerCase()} in ${groupPath[groupPath.length - 1]}`}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {markers.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <Tag className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No {terms.markers.toLowerCase()} yet.</p>
            <button onClick={onNew} className="text-sm text-primary hover:underline mt-1">
              Create your first {terms.markers.slice(0, -1).toLowerCase()}
            </button>
          </div>

        ) : isSearching ? (
          // Global search results — flat list with full path context
          searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No results</p>
          ) : (
            searchResults.map(marker => (
              <SearchResultRow
                key={marker.id}
                marker={marker}
                isSelected={selectedId === marker.id}
                onSelect={() => onSelect(marker.id)}
                onAdd={() => onNewSubmarker({ name: marker.name, color: marker.color, icon: marker.icon })}
                addLabel={addLabel}
              />
            ))
          )

        ) : currentNodes.length === 0 ? (
          // Empty group
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <p className="text-sm text-muted-foreground">No {terms.markers.toLowerCase()} in this group.</p>
            <button
              onClick={() => onNewSubmarker({ name: groupPath.join('/'), color: '#6b7280', icon: null })}
              className="text-sm text-primary hover:underline mt-1"
            >
              Add one
            </button>
          </div>

        ) : (
          // Drill-down view — nodes at current level
          currentNodes.map(node => {
            const currentPath = [...groupPath, node.label]

            if (node.type === 'group') {
              if (node.id) {
                // Group + real marker — selectable row with separate drill-in chevron
                const marker = markerMap.get(node.id)
                return (
                  <MarkerRow
                    key={node.id}
                    id={node.id}
                    label={node.label}
                    color={node.color!}
                    icon={node.icon ?? null}
                    waypointCount={marker?._count.waypoints ?? 0}
                    isSelected={selectedId === node.id}
                    hasDrillIn
                    currentPath={currentPath}
                    onSelect={() => onSelect(node.id!)}
                    onDrillIn={() => onNavigateInto(currentPath)}
                    onAdd={() => onNewSubmarker({ name: currentPath.join('/'), color: node.color!, icon: node.icon ?? null })}
                    addLabel={addLabel}
                  />
                )
              } else {
                // Structural group — entire row navigates in
                return (
                  <GroupRow
                    key={node.label}
                    label={node.label}
                    currentPath={currentPath}
                    onDrillIn={() => onNavigateInto(currentPath)}
                    onAdd={() => onNewSubmarker({ name: currentPath.join('/'), color: '#6b7280', icon: null })}
                    addLabel={addLabel}
                  />
                )
              }
            } else {
              // Plain leaf
              const marker = markerMap.get(node.id)
              return (
                <MarkerRow
                  key={node.id}
                  id={node.id}
                  label={node.label}
                  color={node.color}
                  icon={node.icon ?? null}
                  waypointCount={marker?._count.waypoints ?? 0}
                  isSelected={selectedId === node.id}
                  hasDrillIn={false}
                  currentPath={currentPath}
                  onSelect={() => onSelect(node.id)}
                  onAdd={() => onNewSubmarker({ name: node.name, color: node.color, icon: node.icon ?? null })}
                  addLabel={addLabel}
                />
              )
            }
          })
        )}
      </div>
    </div>
  )
}
