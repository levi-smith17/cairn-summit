'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { NotebookPen } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { FilterBar } from '@/components/filters/filter-bar'
import { LogList } from './log-list'
import { LogForm } from './log-form'
import { Logbook } from './logbook'

interface LogClientProps {
  logs: any[]
  trails: any[]
  waypoints: any[]
  markers: any[]
}

export function LogClient({ logs, trails, waypoints, markers }: LogClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  // ── Logbook mode ────────────────────────────────────────────────────────────
  const logbookTrailId = searchParams.get('logbook')

  if (logbookTrailId) {
    const trail = trails.find((t: any) => t.id === logbookTrailId)
    const trailLogs = [...logs]
      .filter((l: any) => l.trailId === logbookTrailId)
      .sort((a: any, b: any) => {
        if (a.position != null && b.position != null) return a.position - b.position
        if (a.position != null) return -1
        if (b.position != null) return 1
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

    function closeLogbook() {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('logbook')
      params.delete('id')
      router.push(`?${params.toString()}`, { scroll: false })
    }

    const trailWaypoints = waypoints
      .filter((w: any) => w.trailId === logbookTrailId)
      .map((w: any) => ({ id: w.id, title: w.title, url: w.url, description: w.description ?? null }))

    return (
      <>
        <PlatformHeader title={terms.logs} />
        <div className="flex flex-col flex-1 p-4 overflow-hidden min-h-0">
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
            <Logbook
              trailId={logbookTrailId}
              trailName={trail?.name ?? 'Logbook'}
              initialLogs={trailLogs}
              markers={markers}
              waypoints={trailWaypoints}
              initialLogId={searchParams.get('id')}
              onBack={closeLogbook}
            />
          </div>
        </div>
      </>
    )
  }

  // ── Standard two-column mode ────────────────────────────────────────────────
  const selectedId = searchParams.get('id')
  const selectedLog = logs.find((l: any) => l.id === selectedId) ?? null
  const showRightPanel = selectedId !== null

  function selectLog(id: string) {
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

  function openLogbook(trailId: string, firstLogId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('logbook', trailId)
    params.set('id', firstLogId)
    params.delete('trail')  // clear any trail filter so the logbook isn't confused
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <PlatformHeader title={terms.logs} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Filter bar */}
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <FilterBar
            markers={markers}
            trails={trails}
            showTrailFilter
            showMarkerFilter
            showSort
            showUnattached
            showDateRange
            searchPlaceholder={`${terms.explore} ${terms.logs.toLowerCase()}...`}
            fill
          />
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Left — grouped log list */}
          <div
            className={`${showRightPanel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}
          >
            <LogList
              logs={logs}
              selectedId={selectedId}
              onSelect={selectLog}
              onNew={showNew}
              onOpenLogbook={openLogbook}
            />
          </div>

          {/* Right — form */}
          <div
            className={`${showRightPanel ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}
          >
            {selectedId ? (
              <LogForm
                key={selectedId}
                log={selectedLog}
                folders={trails}
                waypoints={waypoints}
                tags={markers}
                onBack={clearSelection}
                onSaved={selectLog}
                onDeleted={clearSelection}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <NotebookPen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a {terms.logs.slice(0, -1).toLowerCase()} to edit, or{' '}
                  <button onClick={showNew} className="text-primary hover:underline">
                    add a new one
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
