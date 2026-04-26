'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Check, ChevronRight, Search, Tag, X, ArrowLeft } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  buildMarkerTree,
  getNodesAtPath,
  getAllLeafIds,
  getAllLeaves,
  type RawMarker,
  type MarkerTreeNode,
  type MarkerGroup,
  type FlatLeaf,
} from '@/lib/marker-groups'

interface MarkerPickerProps {
  markers: RawMarker[]
  selected: string[]           // selected marker IDs
  onChange: (ids: string[]) => void
  placeholder?: string
  align?: 'start' | 'center' | 'end'
  /** Compact mode — small trigger button, used inside tables / filter bars */
  compact?: boolean
  /** Single-select mode — selecting a leaf replaces the selection and closes the popover */
  singleSelect?: boolean
  /** Start drill-down at this path instead of the root (e.g. ['Provisions']) */
  initialPath?: string[]
}

export function MarkerPicker({
  markers,
  selected,
  onChange,
  placeholder = 'Markers',
  align = 'start',
  compact = false,
  singleSelect = false,
  initialPath,
}: MarkerPickerProps) {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<string[]>(initialPath ?? [])
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const tree = useMemo(() => buildMarkerTree(markers), [markers])
  const allLeaves = useMemo(() => getAllLeaves(tree), [tree])

  // Reset navigation when popover closes
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setTimeout(() => { setPath(initialPath ?? []); setSearch('') }, 150)
    }
  }

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  // Derived nodes for current view
  const currentNodes = useMemo(() => getNodesAtPath(tree, path), [tree, path])

  // Search results — flat list with full path
  const searchResults = useMemo<FlatLeaf[]>(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return allLeaves.filter(({ leaf, path: p }) =>
      leaf.label.toLowerCase().includes(q) ||
      p.join('/').toLowerCase().includes(q) ||
      leaf.name.toLowerCase().includes(q)
    )
  }, [allLeaves, search])

  const isSearching = search.trim().length > 0

  // IDs of all leaves under the current group (for select-all, multi-select only)
  const currentGroupLeafIds = useMemo(
    () => getAllLeafIds(currentNodes),
    [currentNodes]
  )
  const allInGroupSelected =
    currentGroupLeafIds.length > 0 &&
    currentGroupLeafIds.every(id => selected.includes(id))
  const someInGroupSelected = currentGroupLeafIds.some(id => selected.includes(id))

  function toggleId(id: string) {
    if (singleSelect) {
      onChange(selected.includes(id) ? [] : [id])
      setOpen(false)
    } else {
      onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
    }
  }

  function toggleGroup() {
    if (allInGroupSelected) {
      onChange(selected.filter(id => !currentGroupLeafIds.includes(id)))
    } else {
      onChange(Array.from(new Set([...selected, ...currentGroupLeafIds])))
    }
  }

  function drillInto(label: string) {
    setSearch('')
    setPath(prev => [...prev, label])
  }

  function navigateTo(index: number) {
    setPath(prev => prev.slice(0, index))
  }

  // ── Trigger label ─────────────────────────────────────────────────────────
  const selectedMarkers = markers.filter(m => selected.includes(m.id))
  const triggerContent = (() => {
    if (selectedMarkers.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>
    }
    if (singleSelect) {
      const m = selectedMarkers[0]
      return (
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: m.color }}
          />
          <span className="truncate">{m.name.split('/').pop()}</span>
        </span>
      )
    }
    const dots = selectedMarkers.map(m => (
      <span
        key={m.id}
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: m.color }}
      />
    ))
    const label =
      selectedMarkers.length <= 5
        ? selectedMarkers.map(m => m.name.split('/').pop()).join(', ')
        : `${selectedMarkers.length} selected`
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="flex items-center gap-0.5 shrink-0">{dots}</span>
        <span className="truncate">{label}</span>
      </span>
    )
  })()

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {compact ? (
          <button className="flex items-center gap-1.5 rounded border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors min-w-[72px] w-full">
            <span className="flex-1 text-left truncate">{triggerContent}</span>
            <ChevronRight className="h-2.5 w-2.5 shrink-0 rotate-90" />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 md:h-8 gap-1.5 text-sm justify-start min-w-[120px] w-full"
          >
            <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left truncate flex items-center gap-1.5">
              {triggerContent}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 rotate-90 text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 overflow-hidden"
        align={align}
        sideOffset={4}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Breadcrumb — hidden during search, hidden at root */}
        {!isSearching && path.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/30 text-xs">
            <button
              onClick={() => navigateTo(path.length - 1)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-0.5 min-w-0 flex-wrap">
              <button
                onClick={() => navigateTo(0)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                All
              </button>
              {path.map((segment, i) => (
                <span key={i} className="flex items-center gap-0.5">
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <button
                    onClick={() => navigateTo(i + 1)}
                    className={
                      i === path.length - 1
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground transition-colors'
                    }
                  >
                    {segment}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        <div className="max-h-64 overflow-y-auto py-1">
          {isSearching ? (
            // Search results — flat with full path shown
            searchResults.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No results</p>
            ) : (
              searchResults.map(({ leaf, path: p }) => (
                <LeafRow
                  key={leaf.id}
                  label={p.join(' / ')}
                  color={leaf.color}
                  selected={selected.includes(leaf.id)}
                  onToggle={() => toggleId(leaf.id)}
                  singleSelect={singleSelect}
                />
              ))
            )
          ) : (
            <>
              {/* Select all — only inside a group, multi-select only */}
              {!singleSelect && path.length > 0 && currentGroupLeafIds.length > 0 && (
                <>
                  <button
                    onClick={toggleGroup}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors text-left"
                  >
                    <Checkbox
                      checked={allInGroupSelected}
                      indeterminate={!allInGroupSelected && someInGroupSelected}
                    />
                    <span className="font-medium">
                      {allInGroupSelected ? 'Deselect all' : 'Select all'} in {path[path.length - 1]}
                    </span>
                  </button>
                  <div className="mx-3 my-1 border-t" />
                </>
              )}

              {/* Nodes at current level */}
              {currentNodes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No markers</p>
              ) : (
                currentNodes.map(node =>
                  node.type === 'group' ? (
                    <GroupRow
                      key={node.label}
                      node={node}
                      selectedCount={getAllLeafIds(node.children).filter(id => selected.includes(id)).length}
                      totalCount={getAllLeafIds(node.children).length}
                      onDrillIn={() => drillInto(node.label)}
                      singleSelect={singleSelect}
                      markerSelected={node.id ? selected.includes(node.id) : false}
                      onToggleMarker={node.id ? () => toggleId(node.id!) : undefined}
                    />
                  ) : (
                    <LeafRow
                      key={node.id}
                      label={node.label}
                      color={node.color}
                      selected={selected.includes(node.id)}
                      onToggle={() => toggleId(node.id)}
                      singleSelect={singleSelect}
                    />
                  )
                )
              )}
            </>
          )}
        </div>

        {/* Footer — clear all (hidden in singleSelect) */}
        {!singleSelect && selected.length > 0 && (
          <div className="border-t px-3 py-2">
            <button
              onClick={() => onChange([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all ({selected.length} selected)
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GroupRow({
  node,
  selectedCount,
  totalCount,
  onDrillIn,
  singleSelect,
  markerSelected,
  onToggleMarker,
}: {
  node: MarkerGroup
  selectedCount: number
  totalCount: number
  onDrillIn: () => void
  singleSelect: boolean
  markerSelected: boolean
  onToggleMarker?: () => void
}) {
  return (
    <div className="flex items-center w-full text-xs hover:bg-muted/60 transition-colors">
      {/* If this group is also a real marker, show a selectable checkbox + dot */}
      {node.id && onToggleMarker && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleMarker() }}
          className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 shrink-0"
          title={`Select "${node.label}"`}
        >
          {!singleSelect && <Checkbox checked={markerSelected} />}
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: node.color }}
          />
        </button>
      )}

      {/* Drill-in button */}
      <button
        type="button"
        onClick={onDrillIn}
        className={`flex items-center gap-2.5 flex-1 min-w-0 py-1.5 pr-3 text-left ${!node.id ? 'pl-3' : ''}`}
      >
        <span className="flex-1 font-medium truncate">{node.label}</span>
        {!singleSelect && selectedCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {selectedCount}/{totalCount}
          </span>
        )}
        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
      </button>
    </div>
  )
}

function LeafRow({
  label,
  color,
  selected,
  onToggle,
  singleSelect,
}: {
  label: string
  color: string
  selected: boolean
  onToggle: () => void
  singleSelect: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs transition-colors text-left ${
        selected ? 'bg-muted/50' : 'hover:bg-muted/40'
      }`}
    >
      {!singleSelect && <Checkbox checked={selected} />}
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1 truncate">{label}</span>
      {selected && <Check className="h-3 w-3 shrink-0 text-foreground/60" />}
    </button>
  )
}

function Checkbox({
  checked,
  indeterminate = false,
}: {
  checked: boolean
  indeterminate?: boolean
}) {
  return (
    <span
      className={`h-3.5 w-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked || indeterminate
          ? 'bg-primary border-primary'
          : 'border-muted-foreground/40'
      }`}
    >
      {indeterminate ? (
        <span className="block h-px w-1.5 bg-primary-foreground" />
      ) : checked ? (
        <Check className="h-2 w-2 text-primary-foreground" />
      ) : null}
    </span>
  )
}
