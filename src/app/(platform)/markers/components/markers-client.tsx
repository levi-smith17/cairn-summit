'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tag } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { MarkersFilterBar } from './markers-filter-bar'
import { MarkerList, type SubmarkerParent } from './marker-list'
import { MarkerForm } from './marker-form'

interface MarkerItem {
  id: string
  name: string
  color: string
  icon: string | null
  _count: { waypoints: number }
}

interface MarkersClientProps {
  markers: MarkerItem[]
}

export function MarkersClient({ markers }: MarkersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  // ── URL-driven state ───────────────────────────────────────────────────────
  const selectedId = searchParams.get('id')

  // Search query: ?q=...
  const search = searchParams.get('q') ?? ''

  // Drill-down path: ?group=AWS/Security → ['AWS', 'Security']
  const groupParam = searchParams.get('group') ?? ''
  const groupPath = groupParam ? groupParam.split('/') : []

  // ── Sub-marker creation state ──────────────────────────────────────────────
  const [parentMarker, setParentMarker] = useState<SubmarkerParent | null>(null)

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedMarker = markers.find(m => m.id === selectedId) ?? null
  const showRightPanel = selectedId !== null

  // ── Navigation helpers ─────────────────────────────────────────────────────
  function buildParams() {
    return new URLSearchParams(searchParams.toString())
  }

  function selectMarker(id: string) {
    setParentMarker(null)
    const p = buildParams()
    p.set('id', id)
    router.push(`?${p.toString()}`, { scroll: false })
  }

  function showNew() {
    setParentMarker(null)
    const p = buildParams()
    p.set('id', 'new')
    router.push(`?${p.toString()}`, { scroll: false })
  }

  function showNewSubmarker(parent: SubmarkerParent) {
    setParentMarker(parent)
    const p = buildParams()
    p.set('id', 'new')
    router.push(`?${p.toString()}`, { scroll: false })
  }

  function clearSelection() {
    setParentMarker(null)
    const p = buildParams()
    p.delete('id')
    router.push(`?${p.toString()}`, { scroll: false })
  }

  function handleSaved(id: string) {
    selectMarker(id)
  }

  function setSearch(q: string) {
    const p = buildParams()
    if (q) p.set('q', q)
    else p.delete('q')
    router.push(`?${p.toString()}`, { scroll: false })
  }

  /** Navigate into a group. path = full new path segments. */
  function navigateIntoGroup(path: string[]) {
    const p = buildParams()
    if (path.length === 0) p.delete('group')
    else p.set('group', path.join('/'))
    p.delete('id')
    setParentMarker(null)
    router.push(`?${p.toString()}`, { scroll: false })
  }

  /** Called by breadcrumb: keep only `index` segments of current path. */
  function navigateTo(index: number) {
    navigateIntoGroup(groupPath.slice(0, index))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PlatformHeader title={terms.markers} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">

        {/* Filter bar */}
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <MarkersFilterBar
            search={search}
            onSearchChange={setSearch}
            groupPath={groupPath}
            onNavigateTo={navigateTo}
          />
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">

          {/* Left — marker list */}
          <div
            className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <MarkerList
              markers={markers}
              search={search}
              groupPath={groupPath}
              selectedId={selectedId}
              onSelect={selectMarker}
              onNew={showNew}
              onNewSubmarker={showNewSubmarker}
              onNavigateInto={navigateIntoGroup}
            />
          </div>

          {/* Right — form */}
          <div
            className={`${showRightPanel ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            {selectedId ? (
              <MarkerForm
                key={selectedId}
                tag={selectedMarker}
                parentMarker={selectedId === 'new' ? parentMarker : null}
                onBack={clearSelection}
                onSaved={handleSaved}
                onDeleted={clearSelection}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a {terms.markers.slice(0, -1).toLowerCase()} to edit, or{' '}
                  <button onClick={showNew} className="text-primary hover:underline">
                    create a new one
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
