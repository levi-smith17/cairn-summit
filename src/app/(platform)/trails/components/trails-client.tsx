'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Folder } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { TrailList } from './trail-list'
import { TrailForm } from './trail-form'

interface Trail {
  id: string
  name: string
  _count: { waypoints: number }
}

interface TrailsClientProps {
  trails: Trail[]
}

export function TrailsClient({ trails }: TrailsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()
  const selectedId = searchParams.get('id')

  const selectedTrail = trails.find(f => f.id === selectedId) ?? null
  // 'new' sentinel or null means show new form; real UUID means edit
  const showRightPanel = selectedId !== null

  function selectTrail(id: string) {
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
    selectTrail(id)
  }

  return (
    <>
      <PlatformHeader title={terms.trails} />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Left — trail list */}
        <div
          className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}
        >
          <TrailList
            trails={trails}
            selectedId={selectedId}
            onSelect={selectTrail}
            onNew={showNew}
          />
        </div>

        {/* Right — form */}
        <div
          className={`${showRightPanel ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}
        >
          {selectedId ? (
            <TrailForm
              key={selectedId}
              trail={selectedTrail}
              onBack={clearSelection}
              onSaved={handleSaved}
              onDeleted={clearSelection}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <Folder className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a {terms.trails.slice(0, -1).toLowerCase()} to edit, or{' '}
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
