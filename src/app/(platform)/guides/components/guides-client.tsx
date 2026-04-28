'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Button } from '@/components/ui/button'
import { GuideList } from './guide-list'
import { GuideForm } from './guide-form'
import { GuideDetail } from './guide-detail'
import { StoneForm } from './stone-form'
import { useTerminology } from '@/contexts/terminology-context'
import { SearchInput } from '@/components/filters/search-input'
import { TrailFilter } from '@/components/filters/trail-filter'
import { MarkerFilter } from '@/components/filters/marker-filter'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteGuide, deleteStone } from '@/actions/guides'

type Mode = 'view' | 'add-guide' | 'edit-guide' | 'add-stone' | 'edit-stone'

type StoneWithMarkers = {
  id: string
  face: string
  core: string
  placement: 'UNPLACED' | 'PLACED' | 'SET' | 'SEATED'
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

type GuideWithStones = {
  id: string
  name: string
  description: string | null
  trailId: string | null
  trail: { id: string; name: string } | null
  createdAt: Date
  stones: StoneWithMarkers[]
}

interface GuidesClientProps {
  guides: GuideWithStones[]
  trails: { id: string; name: string }[]
  markers: { id: string; name: string; color: string; icon: string | null }[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export function GuidesClient({ guides, trails, markers, totalCount, currentPage, pageSize }: GuidesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  // Filter state (client-side, independent of URL)
  const [search, setSearch] = useState('')
  const [trailId, setTrailId] = useState('all')
  const [markerIds, setMarkerIds] = useState<string[]>([])

  const hasActiveFilters = search !== '' || trailId !== 'all' || markerIds.length > 0

  const filteredGuides = useMemo(() => {
    let result = guides
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.stones.some(s => s.face.toLowerCase().includes(q) || s.core.toLowerCase().includes(q))
      )
    }
    if (trailId !== 'all') {
      result = result.filter(g => g.trailId === trailId)
    }
    if (markerIds.length > 0) {
      result = result.filter(g => g.stones.some(s => s.markers.some(m => markerIds.includes(m.markerId))))
    }
    return result
  }, [guides, search, trailId, markerIds])

  const [mode, setMode] = useState<Mode>('view')
  const [editingGuide, setEditingGuide] = useState<GuideWithStones | null>(null)
  const [editingStone, setEditingStone] = useState<StoneWithMarkers | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'guide' | 'stone'; id: string; name: string } | null>(null)

  // Traverse selection
  const [traverseIds, setTraverseIds] = useState<string[]>([])

  function toggleTraverse(id: string) {
    setTraverseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleLaunchTraverse() {
    if (traverseIds.length < 2) return
    router.push(`/guides/traverse?guides=${traverseIds.join(',')}`)
  }

  const selectedGuideId = searchParams.get('guide')
  const selectedGuide = guides.find(g => g.id === selectedGuideId) ?? null

  function selectGuide(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('guide', id)
    router.push(`?${params.toString()}`, { scroll: false })
    setMode('view')
    setEditingStone(null)
  }

  function clearGuideParam() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('guide')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearGuide() {
    clearGuideParam()
    setMode('view')
  }

  function handleAddGuide() {
    setEditingGuide(null)
    clearGuideParam()
    setMode('add-guide')
  }

  function handleEditGuide(guide: GuideWithStones) {
    setEditingGuide(guide)
    setMode('edit-guide')
  }

  function handleLaunchPass(guideId: string) {
    router.push(`/guides/${guideId}/pass`)
  }

  function handleFormDone() {
    setMode('view')
    setEditingGuide(null)
    setEditingStone(null)
  }

  function handleAddStone() {
    setEditingStone(null)
    setMode('add-stone')
  }

  function handleEditStone(stone: StoneWithMarkers) {
    setEditingStone(stone)
    setMode('edit-stone')
  }

  function handleBackToDetail() {
    setMode('view')
    setEditingStone(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'guide') {
      await deleteGuide(deleteTarget.id)
      if (selectedGuideId === deleteTarget.id) clearGuide()
    } else {
      await deleteStone(deleteTarget.id)
    }
    router.refresh()
    setDeleteTarget(null)
    if (deleteTarget.type === 'stone') setMode('view')
  }

  const showForm = mode !== 'view'
  const showRight = !!selectedGuide || showForm

  return (
    <>
      <PlatformHeader title={terms.guides} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Filter bar */}
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${terms.guides.toLowerCase()}…`}
            />
            <MarkerFilter value={markerIds} onChange={setMarkerIds} markers={markers} />
            <TrailFilter value={trailId} onChange={setTrailId} trails={trails} />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-sm"
                onClick={() => { setSearch(''); setTrailId('all'); setMarkerIds([]) }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Left: Guide list */}
          <div className={`${showRight ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <GuideList
              guides={filteredGuides}
              selectedGuideId={selectedGuideId}
              selectedForTraverse={traverseIds}
              onSelect={selectGuide}
              onToggleTraverse={toggleTraverse}
              onNew={handleAddGuide}
              onEdit={handleEditGuide}
              onLaunch={handleLaunchPass}
              onLaunchTraverse={handleLaunchTraverse}
              onDelete={(id, name) => setDeleteTarget({ type: 'guide', id, name })}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
            />
          </div>

          {/* Right: detail / form */}
          <div className={`${showRight ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
            {mode === 'add-guide' || mode === 'edit-guide' ? (
              <GuideForm
                key={editingGuide?.id ?? 'new'}
                guide={editingGuide}
                trails={trails}
                onBack={handleFormDone}
                onSaved={(id) => {
                  handleFormDone()
                  selectGuide(id)
                }}
              />
            ) : mode === 'add-stone' || mode === 'edit-stone' ? (
              <StoneForm
                key={editingStone?.id ?? `new-${selectedGuide?.id}`}
                stone={editingStone}
                guideId={selectedGuide?.id ?? ''}
                markers={markers}
                onBack={handleBackToDetail}
                onSaved={() => {
                  router.refresh()
                  handleBackToDetail()
                }}
                onDeleted={() => {
                  router.refresh()
                  handleBackToDetail()
                  setDeleteTarget(null)
                }}
              />
            ) : selectedGuide ? (
              <GuideDetail
                guide={selectedGuide}
                markers={markers}
                stoneSearch={search}
                stoneMarkerIds={markerIds}
                onBack={clearGuide}
                onEditGuide={() => handleEditGuide(selectedGuide)}
                onLaunchPass={() => handleLaunchPass(selectedGuide.id)}
                onAddStone={handleAddStone}
                onEditStone={handleEditStone}
                onDeleteStone={(id, face) => setDeleteTarget({ type: 'stone', id, name: face })}
                onImported={() => router.refresh()}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted-foreground text-sm">
                <p>Select a {terms.guide.toLowerCase()} to view its {terms.stones.toLowerCase()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleteTarget?.type === 'guide' ? terms.guide : terms.stone}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{deleteTarget?.name}&rdquo;?
              {deleteTarget?.type === 'guide' && ` All ${terms.stones.toLowerCase()} in this ${terms.guide.toLowerCase()} will also be removed.`}
              {' '}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
