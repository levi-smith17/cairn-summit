import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, LayoutList, Plus } from 'lucide-react'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { useTerminology } from '@/contexts/terminology-context'
import { createTrail } from '@/lib/api/trails'
import { saveLog } from '@/lib/api/logs'
import { Logbook } from './logbook'
import { LogsRail, type LogbookSummary } from './logs-rail'
import { LogsNewInspector } from './logs-new-inspector'
import { LogsPageOrderInspector } from './logs-page-order-inspector'

interface LogClientProps {
  logs: any[]
  logbookTrailLogs?: any[]
  trails: any[]
  waypoints: any[]
  markers: any[]
}

type InspectorMode = 'new' | 'reorder'

function sortLogs(a: any, b: any) {
  if (a.position != null && b.position != null) return a.position - b.position
  if (a.position != null) return -1
  if (b.position != null) return 1
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

function groupLogbooks(logs: any[], trails: any[], termsLogbook: string): LogbookSummary[] {
  const map = new Map<string, LogbookSummary>()

  for (const log of logs) {
    const trailId = log.trailId ?? null
    const key = trailId ?? '__unfiled__'
    if (!map.has(key)) {
      const trail = trailId ? trails.find((t: any) => t.id === trailId) : null
      map.set(key, {
        id: key,
        trailId,
        name: trail?.name ?? (trailId ? 'Unknown' : 'Unfiled'),
        pageCount: 0,
        updatedAt: String(log.createdAt ?? ''),
        logs: [],
      })
    }
    const book = map.get(key)!
    book.logs.push({
      id: log.id,
      title: log.title ?? null,
      content: log.content ?? '',
    })
    book.pageCount += 1
    const created = String(log.createdAt ?? '')
    if (created > book.updatedAt) book.updatedAt = created
  }

  const named = [...map.values()]
    .filter((b) => b.trailId !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
  const unfiled = map.get('__unfiled__')
  return unfiled ? [...named, { ...unfiled, name: unfiled.name || termsLogbook }] : named
}

export function LogsClient({ logs, trails, waypoints, markers }: LogClientProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { terms } = useTerminology()
  const { pinned: inspectorPinned } = useInspectorPin()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [inspectorMode, setInspectorMode] = useState<InspectorMode | null>(null)
  const [inspectorEngaged, setInspectorEngaged] = useState(false)
  const [bookLogsOverride, setBookLogsOverride] = useState<any[] | null>(null)

  const logbooks = useMemo(
    () => groupLogbooks(logs, trails, terms.logbook),
    [logs, trails, terms.logbook],
  )

  const usedTrailIds = useMemo(
    () => new Set(logbooks.filter((b) => b.trailId).map((b) => b.trailId!)),
    [logbooks],
  )
  const availableTrails = useMemo(
    () => trails.filter((t: any) => !usedTrailIds.has(t.id)),
    [trails, usedTrailIds],
  )

  const selectedBookId = searchParams.get('book') ?? searchParams.get('logbook')
  const selectedPageId = searchParams.get('page') ?? searchParams.get('id')
  const selectedBook = selectedBookId
    ? logbooks.find((book) => book.id === selectedBookId) ?? null
    : null

  const bookLogs = useMemo(() => {
    if (!selectedBook) return []
    if (bookLogsOverride) return bookLogsOverride
    return [...logs]
      .filter((l: any) =>
        selectedBook.trailId
          ? l.trailId === selectedBook.trailId
          : !l.trailId,
      )
      .sort(sortLogs)
  }, [selectedBook, logs, bookLogsOverride])

  useEffect(() => {
    setBookLogsOverride(null)
  }, [selectedBookId, logs])

  const trailWaypoints = useMemo(() => {
    if (!selectedBook?.trailId) return []
    return waypoints
      .filter((w: any) => w.trailId === selectedBook.trailId)
      .map((w: any) => ({
        id: w.id,
        title: w.title,
        url: w.url,
        description: w.description ?? null,
      }))
  }, [selectedBook, waypoints])

  function selectBook(bookId: string, pageId?: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('book', bookId)
    params.delete('logbook')
    if (pageId) {
      params.set('page', pageId)
      params.delete('id')
    } else {
      params.delete('page')
      params.delete('id')
    }
    setSearchParams(params)
    if (inspectorPinned || inspectorEngaged) setInspectorMode('reorder')
  }

  function selectPage(pageId: string) {
    if (!selectedBookId) return
    selectBook(selectedBookId, pageId)
  }

  const clearSelection = useCallback(() => {
    setInspectorMode(null)
    setInspectorEngaged(false)
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('book')
      next.delete('logbook')
      next.delete('page')
      next.delete('id')
      return next
    })
  }, [setSearchParams])

  function openNewInspector() {
    setInspectorMode('new')
    setInspectorEngaged(true)
  }

  function openReorderInspector() {
    setInspectorMode('reorder')
    setInspectorEngaged(true)
  }

  async function handleCreateLogbook(input: { trailId?: string; newTrailName?: string }) {
    setCreating(true)
    try {
      let trailId = input.trailId
      if (input.newTrailName) {
        const trail = await createTrail({ name: input.newTrailName })
        trailId = trail.id
        await queryClient.invalidateQueries({ queryKey: ['trails'] })
      }
      if (!trailId) return

      const created = await saveLog({
        title: null,
        content: '<p></p>',
        trailId,
        markerIds: [],
        waypointId: null,
      })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
      setInspectorMode('reorder')
      setInspectorEngaged(true)
      selectBook(trailId, created.id)
    } finally {
      setCreating(false)
    }
  }

  function handleCancelNew() {
    setInspectorMode(selectedBook ? 'reorder' : null)
    if (!selectedBook) setInspectorEngaged(false)
  }

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (inspectorPinned || !inspectorEngaged) return
      const target = event.target as HTMLElement
      if (target.closest('[data-inspectable]')) return
      if (selectedBook && inspectorMode === 'reorder') {
        setInspectorEngaged(false)
        setInspectorMode(null)
        return
      }
      if (inspectorMode === 'new') {
        setInspectorEngaged(false)
        setInspectorMode(null)
      }
    },
    [inspectorPinned, inspectorEngaged, selectedBook, inspectorMode],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && inspectorEngaged) {
        setInspectorEngaged(false)
        setInspectorMode(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, inspectorEngaged])

  const activeInspectorMode =
    inspectorMode ?? (selectedBook && inspectorEngaged ? 'reorder' : null)
  const inspectorContentAvailable =
    activeInspectorMode === 'new' || (activeInspectorMode === 'reorder' && Boolean(selectedBook))
  const inspectorOpen = (inspectorPinned || inspectorEngaged) && inspectorContentAvailable
  const inspectorState = inspectorOpen
    ? 'open'
    : inspectorContentAvailable || inspectorPinned
      ? 'hint'
      : selectedBook
        ? 'hint'
        : 'hidden'

  const singular = terms.logs.slice(0, -1) || terms.logs
  const inspectorHint =
    activeInspectorMode === 'new'
      ? `Open the inspector to create a ${singular.toLowerCase()}`
      : selectedBook
        ? 'Open the inspector to reorder pages'
        : `Select a ${terms.logbook.toLowerCase()}`

  return (
    <StudioLayout
      railLabel={terms.logbook}
      contextBar={
        <PlatformStudioContextBar
          aria-label={`${terms.logs} header`}
          title={terms.logs}
          subtitle={`${logbooks.length} ${terms.logbook.toLowerCase()}${logbooks.length === 1 ? '' : 's'}`}
          actions={
            <>
              {selectedBook ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={activeInspectorMode === 'reorder' && inspectorEngaged ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={openReorderInspector}
                      aria-label="Reorder pages"
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reorder pages</TooltipContent>
                </Tooltip>
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={activeInspectorMode === 'new' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={openNewInspector}
                    aria-label={`Add ${singular.toLowerCase()}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add {singular.toLowerCase()}</TooltipContent>
              </Tooltip>
            </>
          }
        />
      }
      rail={
        <LogsRail
          logbooks={logbooks}
          selectedBookId={selectedBookId}
          search={search}
          onSearchChange={setSearch}
          onSelectBook={selectBook}
          onNew={openNewInspector}
        />
      }
      canvas={
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden" onPointerDown={handleCanvasPointerDown}>
          {selectedBook ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-inspectable>
              <Logbook
                trailId={selectedBook.trailId}
                trailName={selectedBook.name}
                initialLogs={bookLogs}
                markers={markers}
                waypoints={trailWaypoints}
                initialLogId={selectedPageId}
                onBack={clearSelection}
              />
            </div>
          ) : (
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Select a {terms.logbook.toLowerCase()}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Each {terms.logbook.toLowerCase()} belongs to a{' '}
                {terms.trails.slice(0, -1).toLowerCase()}. Pick one from the rail, or create a new one
                from the toolbar.
              </p>
            </div>
          )}
        </div>
      }
      inspectorState={inspectorState}
      inspectorHint={inspectorHint}
      inspector={
        activeInspectorMode === 'new' ? (
          <LogsNewInspector
            trails={availableTrails}
            onCancel={handleCancelNew}
            onCreate={handleCreateLogbook}
            creating={creating}
          />
        ) : selectedBook ? (
          <LogsPageOrderInspector
            logs={bookLogs}
            activePageId={selectedPageId}
            bookName={selectedBook.name}
            onLogsChange={setBookLogsOverride}
            onSelectPage={selectPage}
          />
        ) : inspectorPinned ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inspector
              </p>
            </div>
            <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
              Select a {terms.logbook.toLowerCase()} to reorder pages, or create a new one.
            </p>
          </div>
        ) : null
      }
    />
  )
}
