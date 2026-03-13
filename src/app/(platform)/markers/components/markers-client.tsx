'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tag } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { MarkerList } from './marker-list'
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
  const selectedId = searchParams.get('id')

  const selectedMarker = markers.find(t => t.id === selectedId) ?? null
  const showRightPanel = selectedId !== null

  function selectMarker(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function showNew() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', 'new')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleSaved(id: string) {
    selectMarker(id)
  }

  return (
    <>
      <PlatformHeader title={terms.markers} />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Left — marker list */}
        <div
          className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}
        >
          <MarkerList
            markers={markers}
            selectedId={selectedId}
            onSelect={selectMarker}
            onNew={showNew}
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
    </>
  )
}
