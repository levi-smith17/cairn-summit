'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { NotebookPen, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { FilterBar } from '@/components/filters/filter-bar'
import { LogList } from './log-list'
import { LogForm } from './log-form'
import { Logbook } from './logbook'

interface LogClientProps {
  logs: any[]
  logbookTrailLogs?: any[]
  trails: any[]
  waypoints: any[]
  markers: any[]
  totalCount: number
  currentPage: number
  logsPerPage: number
}

export function LogClient({ logs, logbookTrailLogs, trails, waypoints, markers, totalCount, currentPage, logsPerPage }: LogClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  // ── Logbook mode ────────────────────────────────────────────────────────────
  const logbookTrailId = searchParams.get('logbook')

  if (logbookTrailId) {
    const trail = trails.find((t: any) => t.id === logbookTrailId)
    const sortFn = (a: any, b: any) => {
      if (a.position != null && b.position != null) return a.position - b.position
      if (a.position != null) return -1
      if (b.position != null) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    const trailLogs = (
      logbookTrailLogs && logbookTrailLogs.length > 0
        ? [...logbookTrailLogs]
        : [...logs].filter((l: any) => l.trailId === logbookTrailId)
    ).sort(sortFn)

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
              trailName={trail?.name ?? terms.logbook}
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
    params.delete('trailId')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <PlatformHeader title={terms.logs} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Filter bar */}
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-1.5">
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
              trailingAction={
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden h-8 gap-1.5 text-sm"
                  onClick={() => router.push('/settings?section=logs')}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Button>
              }
            />
            <div className="hidden md:block flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-8 w-8 shrink-0"
                  onClick={() => router.push('/settings?section=logs')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{terms.logs} Settings</TooltipContent>
            </Tooltip>
          </div>
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
              totalCount={totalCount}
              currentPage={currentPage}
              logsPerPage={logsPerPage}
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
                defaultTrailId={selectedLog ? undefined : (searchParams.get('trailId') ?? undefined)}
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
