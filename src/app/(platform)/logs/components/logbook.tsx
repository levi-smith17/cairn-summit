'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Bookmark, ChevronLeft, ChevronRight, ChevronDown, Check, ExternalLink, FilePlus, GripVertical,
  LayoutList, Loader2, Save, Search, Trash2, X,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MarkerPicker } from '@/components/ui/marker-picker'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { saveLog, deleteLog, reorderLogs } from '@/actions/logs'
import { RichEditor, type FontSize } from '@/components/ui/rich-editor'
import { useTerminology } from '@/contexts/terminology-context'

const POPUP_PAGE_SIZE = 20
const REORDER_PAGE_SIZE = 25

// ── Types ──────────────────────────────────────────────────────────────────────

interface LogItem {
  id: string
  title: string | null
  content: string
  position: number | null
  createdAt: Date | string
  trailId: string | null
  waypointId: string | null
  trail: { id: string; name: string } | null
  waypoint: { id: string; title: string } | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

function pagePreview(log: LogItem) {
  return log.title
    || log.content.replace(/<[^>]*>/g, '').trim().slice(0, 80)
    || 'Empty page'
}

// ── SortablePageRow ────────────────────────────────────────────────────────────

function SortablePageRow({
  log,
  index,
  isActive,
  compact = false,
  canDrag = true,
  onNavigate,
  totalCount,
  onMoveToPosition,
}: {
  log: LogItem
  index: number
  isActive: boolean
  compact?: boolean
  canDrag?: boolean
  onNavigate?: () => void
  totalCount?: number
  onMoveToPosition?: (targetIndex: number) => void
}) {
  const [posEditing, setPosEditing] = useState(false)
  const [posValue, setPosValue] = useState('')

  function commitPosition() {
    const n = parseInt(posValue, 10)
    if (!isNaN(n) && n >= 1 && n <= (totalCount ?? 1) && n - 1 !== index) {
      onMoveToPosition?.(n - 1)
    }
    setPosEditing(false)
    setPosValue('')
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: log.id,
    disabled: !canDrag,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const preview = pagePreview(log)

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 px-3 text-xs transition-colors',
          isDragging && 'opacity-40',
          isActive ? 'bg-primary/10' : '',
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          type="button"
          className={cn(
            'py-2 shrink-0 text-muted-foreground/30 transition-colors',
            canDrag
              ? 'hover:text-muted-foreground cursor-grab active:cursor-grabbing'
              : 'cursor-default opacity-30',
          )}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* Page number */}
        <span className="text-muted-foreground tabular-nums shrink-0 w-4 text-right">{index + 1}</span>

        {/* Clickable content */}
        <button
          type="button"
          className="flex-1 min-w-0 text-left py-2 hover:opacity-70 transition-opacity"
          onClick={onNavigate}
        >
          <p className={cn('truncate', log.title ? 'font-medium' : 'text-muted-foreground')}>{preview}</p>
          <p className="text-muted-foreground/60 mt-0.5">{format(new Date(log.createdAt), 'MMM d, yyyy')}</p>
        </button>

        {isActive && <Check className="h-3 w-3 text-primary shrink-0" />}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-4 px-6 py-4 border-b transition-colors select-none',
        isDragging ? 'opacity-40 bg-muted shadow-md' : isActive ? 'bg-primary/5' : 'hover:bg-muted/30',
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Page number — clickable to jump to a position when onMoveToPosition is provided */}
      {onMoveToPosition ? (
        posEditing ? (
          <input
            type="number"
            autoFocus
            min={1}
            max={totalCount}
            value={posValue}
            onChange={e => setPosValue(e.target.value)}
            onBlur={commitPosition}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitPosition() }
              if (e.key === 'Escape') { setPosEditing(false); setPosValue('') }
            }}
            className="w-10 text-sm text-right bg-transparent border-b border-border outline-none tabular-nums text-muted-foreground shrink-0"
          />
        ) : (
          <button
            type="button"
            title={`Position ${index + 1} — click to move`}
            onClick={() => { setPosEditing(true); setPosValue(String(index + 1)) }}
            className="text-sm text-muted-foreground tabular-nums w-6 text-right shrink-0 hover:text-foreground hover:underline transition-colors"
          >
            {index + 1}
          </button>
        )
      ) : (
        <span className="text-sm text-muted-foreground tabular-nums w-6 text-right shrink-0">{index + 1}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', log.title ? 'font-medium' : 'text-muted-foreground')}>{preview}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{format(new Date(log.createdAt), 'MMM d, yyyy')}</p>
      </div>

      {isActive && <span className="text-xs text-primary font-medium shrink-0">Editing</span>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface WaypointItem {
  id: string
  title: string
  url: string
  description?: string | null
}

interface LogbookProps {
  trailId: string
  trailName: string
  initialLogs: LogItem[]
  markers: any[]
  waypoints: WaypointItem[]
  initialLogId?: string | null
  onBack: () => void
}

export function Logbook({
  trailId,
  trailName,
  initialLogs,
  markers,
  waypoints,
  initialLogId,
  onBack,
}: LogbookProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { terms } = useTerminology()

  // ── Page list ──────────────────────────────────────────────────────────────
  const [localLogs, setLocalLogs] = useState<LogItem[]>(initialLogs)

  const resolveInitialIndex = () => {
    if (initialLogId) {
      const idx = initialLogs.findIndex(l => l.id === initialLogId)
      return idx >= 0 ? idx : 0
    }
    return 0
  }

  const [currentIndex, setCurrentIndex] = useState(resolveInitialIndex)
  const currentLog = localLogs[currentIndex] ?? null

  // ── Content, title & markers ───────────────────────────────────────────────
  const [content, setContent] = useState(currentLog?.content ?? '')
  const [savedContent, setSavedContent] = useState(currentLog?.content ?? '')
  const [title, setTitle] = useState(currentLog?.title ?? '')
  const [savedTitle, setSavedTitle] = useState(currentLog?.title ?? '')
  const [markerIds, setMarkerIds] = useState<string[]>(
    currentLog?.markers?.map(m => m.markerId) ?? []
  )

  const isDirty = content !== savedContent || title !== savedTitle

  // Refs so callbacks always see latest values without stale closures
  const contentRef = useRef(content)
  const titleRef = useRef(title)
  const markerIdsRef = useRef(markerIds)
  const currentIndexRef = useRef(currentIndex)
  contentRef.current = content
  titleRef.current = title
  markerIdsRef.current = markerIds
  currentIndexRef.current = currentIndex

  // Title auto-save timer (separate from marker timer)
  const titleAutoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // ── Saving ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  function cancelAutoSave() {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null }
    if (titleAutoSaveTimer.current) { clearTimeout(titleAutoSaveTimer.current); titleAutoSaveTimer.current = null }
  }

  const persistLog = useCallback(async (
    logId: string,
    html: string,
    ids: string[],
    pageTitle: string,
    message: string | false = 'Saved',
  ) => {
    await saveLog({ id: logId, title: pageTitle || null, content: html, trailId, markerIds: ids })
    setSavedContent(html)
    setSavedTitle(pageTitle)
    setLocalLogs(prev => prev.map(l =>
      l.id === logId ? { ...l, title: pageTitle || null, content: html } : l
    ))
    if (message) toast.success(message)
  }, [trailId])

  async function handleSave() {
    if (!currentLog) return
    cancelAutoSave()
    setSaving(true)
    try {
      await persistLog(currentLog.id, contentRef.current, markerIdsRef.current, titleRef.current)
    } finally {
      setSaving(false)
    }
  }

  function handleContentChange(html: string) {
    setContent(html)
    contentRef.current = html
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    titleRef.current = val
    if (titleAutoSaveTimer.current) clearTimeout(titleAutoSaveTimer.current)
    titleAutoSaveTimer.current = setTimeout(async () => {
      const log = localLogs[currentIndexRef.current]
      if (!log) return
      await persistLog(log.id, contentRef.current, markerIdsRef.current, val, 'Title saved')
    }, 800)
  }

  function handleMarkersChange(ids: string[]) {
    setMarkerIds(ids)
    markerIdsRef.current = ids
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const log = localLogs[currentIndexRef.current]
      if (!log) return
      await persistLog(log.id, contentRef.current, ids, titleRef.current, `${terms.markers} saved`)
    }, 400)
  }

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/logs/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Upload failed')
    }
    const data = await res.json()
    return data.url as string
  }, [])

  // ── Ctrl+S shortcut ────────────────────────────────────────────────────────
  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Animation ──────────────────────────────────────────────────────────────
  const [flipKey, setFlipKey] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [pendingNavTarget, setPendingNavTarget] = useState<number | null>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  function updateUrl(logId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', logId)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function doNavigate(targetIndex: number, dir: 'next' | 'prev') {
    cancelAutoSave()
    const target = localLogs[targetIndex]
    if (!target) return
    setDirection(dir)
    setFlipKey(k => k + 1)
    setCurrentIndex(targetIndex)
    setContent(target.content)
    setSavedContent(target.content)
    setTitle(target.title ?? '')
    setSavedTitle(target.title ?? '')
    setMarkerIds(target.markers?.map(m => m.markerId) ?? [])
    updateUrl(target.id)
  }

  function navigate(targetIndex: number, dir: 'next' | 'prev') {
    if (isDirty) {
      setPendingNavTarget(targetIndex)
      setShowUnsavedDialog(true)
      return
    }
    doNavigate(targetIndex, dir)
  }

  function handleUnsavedSave() {
    setShowUnsavedDialog(false)
    handleSave().then(() => {
      if (pendingNavTarget !== null) {
        const dir = pendingNavTarget > currentIndex ? 'next' : 'prev'
        doNavigate(pendingNavTarget, dir)
        setPendingNavTarget(null)
      }
    })
  }

  function handleUnsavedDiscard() {
    setShowUnsavedDialog(false)
    setSavedContent(content)
    setSavedTitle(title)
    if (pendingNavTarget !== null) {
      const dir = pendingNavTarget > currentIndex ? 'next' : 'prev'
      doNavigate(pendingNavTarget, dir)
      setPendingNavTarget(null)
    }
  }

  // ── Add page ───────────────────────────────────────────────────────────────
  const [addingPage, setAddingPage] = useState(false)
  const [showAddPageDialog, setShowAddPageDialog] = useState(false)

  async function doAddPage(saveFirst: boolean) {
    cancelAutoSave()
    setAddingPage(true)
    // Capture current values before any awaits to avoid stale closures
    const logToSave = currentLog
    const contentSnapshot = contentRef.current
    const titleSnapshot = titleRef.current
    const markerIdsSnapshot = markerIdsRef.current
    const newIndex = localLogs.length // index the new item will occupy
    try {
      if (saveFirst && logToSave) {
        await persistLog(logToSave.id, contentSnapshot, markerIdsSnapshot, titleSnapshot, false)
      }
      const newLog = await saveLog({ title: null, content: '<p></p>', trailId, markerIds: [] })
      const newItem: LogItem = {
        id: newLog.id,
        title: null,
        content: newLog.content,
        position: null,
        createdAt: newLog.createdAt,
        trailId: newLog.trailId,
        waypointId: newLog.waypointId,
        trail: { id: trailId, name: trailName },
        waypoint: null,
        markers: [],
      }
      // Use functional updater so we build on top of persistLog's update rather
      // than the stale closure snapshot, preserving the saved content for the old page.
      setLocalLogs(prev => {
        const updated = saveFirst && logToSave
          ? prev.map(l => l.id === logToSave.id
              ? { ...l, title: titleSnapshot || null, content: contentSnapshot }
              : l)
          : prev
        return [...updated, newItem]
      })
      // Navigate directly — setLocalLogs hasn't flushed yet so we can't use doNavigate
      setDirection('next')
      setFlipKey(k => k + 1)
      setCurrentIndex(newIndex)
      setContent(newItem.content)
      setSavedContent(newItem.content)
      setTitle('')
      setSavedTitle('')
      setMarkerIds([])
      updateUrl(newItem.id)
    } catch {
      toast.error('Failed to add page')
    } finally {
      setAddingPage(false)
    }
  }

  function requestAddPage() {
    setShowAddPageDialog(true)
  }

  // ── Delete page ────────────────────────────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDeletePage() {
    if (!currentLog || localLogs.length <= 1) return
    setDeleting(true)
    try {
      await deleteLog(currentLog.id)
      const newLogs = localLogs.filter(l => l.id !== currentLog.id)
      const newIndex = Math.min(currentIndex, newLogs.length - 1)
      setLocalLogs(newLogs)
      cancelAutoSave()
      setDirection('prev')
      setFlipKey(k => k + 1)
      setCurrentIndex(newIndex)
      const target = newLogs[newIndex]
      setContent(target.content)
      setSavedContent(target.content)
      setTitle(target.title ?? '')
      setSavedTitle(target.title ?? '')
      setMarkerIds(target.markers?.map(m => m.markerId) ?? [])
      updateUrl(target.id)
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // ── Reorder (DnD) ──────────────────────────────────────────────────────────
  const [reorderMode, setReorderMode] = useState(false)

  const [logbookFontSize, setLogbookFontSize] = useState<FontSize>('sm')

  useEffect(() => {
    const saved = window.localStorage.getItem('logbook-font-size')
    if (['sm', 'base', 'lg', 'xl'].includes(saved ?? '')) {
      setLogbookFontSize(saved as FontSize)
    }
  }, [])

  function handleFontSizeChange(size: FontSize) {
    setLogbookFontSize(size)
    window.localStorage.setItem('logbook-font-size', size)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localLogs.findIndex(l => l.id === active.id)
    const newIndex = localLogs.findIndex(l => l.id === over.id)
    const newOrder = arrayMove(localLogs, oldIndex, newIndex)

    // Keep currentIndex pointing to the same log after reorder
    const currentLogId = currentLog?.id
    const newCurrentIndex = newOrder.findIndex(l => l.id === currentLogId)
    if (newCurrentIndex !== -1) setCurrentIndex(newCurrentIndex)

    setLocalLogs(newOrder)
    reorderLogs(newOrder.map(l => l.id)).catch(console.error)
  }

  // ── Waypoints popover (separate state per breakpoint to avoid dual-anchor conflict) ──
  const [waypointsOpenMobile, setWaypointsOpenMobile] = useState(false)
  const [waypointsOpenDesktop, setWaypointsOpenDesktop] = useState(false)

  // ── Page list popover ──────────────────────────────────────────────────────
  const [pageListOpen, setPageListOpen] = useState(false)
  const [pageSearch, setPageSearch] = useState('')
  const [popoverPage, setPopoverPage] = useState(0)
  const [reorderPage, setReorderPage] = useState(0)
  const pageSearchRef = useRef<HTMLInputElement>(null)

  const filteredPages = useMemo(() => {
    const q = pageSearch.trim().toLowerCase()
    if (!q) return localLogs
    return localLogs.filter(l =>
      l.title?.toLowerCase().includes(q) ||
      l.content.replace(/<[^>]*>/g, '').toLowerCase().includes(q)
    )
  }, [localLogs, pageSearch])

  const popoverTotalPages = Math.ceil(localLogs.length / POPUP_PAGE_SIZE)
  const showPopoverPagination = !pageSearch && popoverTotalPages > 1
  const paginatedPopoverPages = pageSearch
    ? filteredPages
    : filteredPages.slice(popoverPage * POPUP_PAGE_SIZE, (popoverPage + 1) * POPUP_PAGE_SIZE)

  const reorderTotalPages = Math.ceil(localLogs.length / REORDER_PAGE_SIZE)
  const pagedReorderLogs = localLogs.slice(reorderPage * REORDER_PAGE_SIZE, (reorderPage + 1) * REORDER_PAGE_SIZE)

  function handlePageListOpenChange(open: boolean) {
    setPageListOpen(open)
    if (!open) {
      setPageSearch('')
    } else {
      setPopoverPage(Math.floor(currentIndex / POPUP_PAGE_SIZE))
      setTimeout(() => pageSearchRef.current?.focus(), 50)
    }
  }

  function handlePageSearchChange(val: string) {
    setPageSearch(val)
    if (val) setPopoverPage(0)
  }

  function handleMoveToPosition(logId: string, targetIndex: number) {
    const fromIndex = localLogs.findIndex(l => l.id === logId)
    if (fromIndex === -1 || fromIndex === targetIndex) return
    const newOrder = arrayMove(localLogs, fromIndex, targetIndex)
    const currentLogId = currentLog?.id
    const newCurrentIndex = newOrder.findIndex(l => l.id === currentLogId)
    if (newCurrentIndex !== -1) setCurrentIndex(newCurrentIndex)
    setLocalLogs(newOrder)
    reorderLogs(newOrder.map(l => l.id)).catch(console.error)
  }

  // ── Animation style ────────────────────────────────────────────────────────
  const animStyle: React.CSSProperties = flipKey > 0
    ? { animation: `logbook-${direction === 'next' ? 'from-right' : 'from-left'} 220ms ease-out` }
    : {}

  const canPrev = currentIndex > 0
  const canNext = currentIndex < localLogs.length - 1

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <style>{`
        @keyframes logbook-from-right {
          from { transform: translateX(28px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes logbook-from-left {
          from { transform: translateX(-28px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>

      {/* ── Action bar ── */}
      <div className="flex flex-col border-b shrink-0 sm:flex-row sm:items-stretch sm:gap-2 sm:px-4">

        {/* Row 1 (always): back button + trail name + title */}
        <div className="flex items-stretch gap-2 px-4 sm:px-0 sm:flex-1 sm:min-w-0">
          <button
            onClick={onBack}
            className="self-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Trail name | divider | title — fills remaining width, divider is full-height */}
          <div className="flex flex-1 min-w-0 items-stretch">
            <span className="flex-1 min-w-0 py-2.5 text-sm font-medium truncate flex items-center">
              {trailName}
              {!reorderMode && isDirty && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" title="Unsaved changes" />
              )}
            </span>

            {!reorderMode && (
              <>
                <div className="w-px bg-border shrink-0" />
                <input
                  type="text"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Title (optional)"
                  className="flex-1 min-w-0 py-2.5 px-3 text-sm font-medium bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
                />
              </>
            )}
          </div>

          {/* Reorder controls — inline with name on mobile, separate on desktop */}
          {reorderMode && (
            <>
              <span className="text-xs text-muted-foreground hidden sm:flex items-center">Drag pages to reorder</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0 self-center"
                onClick={() => setReorderMode(false)}
              >
                Done
              </Button>
            </>
          )}
        </div>

        {reorderMode && (
          /* Reorder hint on mobile (below name row) */
          <p className="sm:hidden text-xs text-muted-foreground px-4 pb-2">Drag pages to reorder</p>
        )}

        {!reorderMode && (
          <>
            {/* Row 2 (mobile): Marker picker */}
            <div className="px-4 pb-2 sm:hidden">
              <MarkerPicker
                markers={markers}
                selected={markerIds}
                onChange={handleMarkersChange}
                placeholder="Markers"
              />
            </div>

            {/* Row 3 (mobile): icon buttons evenly spaced */}
            <div className="flex items-center justify-around px-2 pb-2 sm:hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9"
                    onClick={handleSave} disabled={saving || !isDirty}>
                    {saving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Save className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save (Ctrl+S)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9"
                    onClick={requestAddPage} disabled={addingPage}>
                    {addingPage
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <FilePlus className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add page</TooltipContent>
              </Tooltip>

              {waypoints.length > 0 && (
                <Popover open={waypointsOpenMobile} onOpenChange={setWaypointsOpenMobile}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Trail waypoints</TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-80 p-0 bg-card border-border overflow-hidden" align="center" side="bottom" sideOffset={8}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b">
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{trailName} waypoints</span>
                      <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{waypoints.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {waypoints.map(wp => (
                        <a
                          key={wp.id}
                          href={wp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{wp.title}</p>
                            {wp.description && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{wp.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{wp.url}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9"
                    onClick={() => { setReorderMode(true); setReorderPage(Math.floor(currentIndex / REORDER_PAGE_SIZE)) }}>
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reorder pages</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive/80"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting || localLogs.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove page</TooltipContent>
              </Tooltip>
            </div>

            {/* Desktop: all controls inline */}
            <div className="hidden sm:flex items-center gap-2 sm:py-2.5">
              <div className="shrink-0">
                <MarkerPicker
                  markers={markers}
                  selected={markerIds}
                  onChange={handleMarkersChange}
                  placeholder="Markers"
                />
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                    onClick={handleSave} disabled={saving || !isDirty}>
                    {saving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save (Ctrl+S)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                    onClick={requestAddPage} disabled={addingPage}>
                    {addingPage
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <FilePlus className="h-3.5 w-3.5" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add page</TooltipContent>
              </Tooltip>

              {/* Waypoints popover — only shown when the trail has waypoints */}
              {waypoints.length > 0 && (
                <Popover open={waypointsOpenDesktop} onOpenChange={setWaypointsOpenDesktop}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <Bookmark className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Trail waypoints</TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-80 p-0 bg-card border-border overflow-hidden" align="end" sideOffset={6}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b">
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">{trailName} waypoints</span>
                      <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{waypoints.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {waypoints.map(wp => (
                        <a
                          key={wp.id}
                          href={wp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{wp.title}</p>
                            {wp.description && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{wp.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{wp.url}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => { setReorderMode(true); setReorderPage(Math.floor(currentIndex / REORDER_PAGE_SIZE)) }}>
                    <LayoutList className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reorder pages</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/80"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting || localLogs.length <= 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove page</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* ── Navigation bar (hidden in reorder mode) ── */}
      {!reorderMode && (
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0 bg-muted/20">
          <Button
            variant="ghost" size="sm" className="h-7 gap-1 text-xs"
            onClick={() => navigate(currentIndex - 1, 'prev')} disabled={!canPrev}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Button>

          {/* Page list popover */}
          <Popover open={pageListOpen} onOpenChange={handlePageListOpenChange}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors tabular-nums">
                Page {currentIndex + 1} of {localLogs.length}
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-card border-border overflow-hidden" align="center" side="bottom" sideOffset={8}>
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 border-b">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  ref={pageSearchRef}
                  value={pageSearch}
                  onChange={e => handlePageSearchChange(e.target.value)}
                  placeholder="Search pages…"
                  className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                />
                {pageSearch && (
                  <button type="button" onClick={() => handlePageSearchChange('')}
                    className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Hint when search is active (drag disabled) */}
              {pageSearch && (
                <p className="px-3 py-1.5 text-[10px] text-muted-foreground/60 border-b bg-muted/20">
                  Clear search to reorder pages
                </p>
              )}

              {/* Sortable page list */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={paginatedPopoverPages.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="max-h-72 overflow-y-auto">
                    {paginatedPopoverPages.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No results</p>
                    ) : (
                      paginatedPopoverPages.map(log => {
                        const realIdx = localLogs.indexOf(log)
                        return (
                          <SortablePageRow
                            key={log.id}
                            log={log}
                            index={realIdx}
                            isActive={realIdx === currentIndex}
                            compact
                            canDrag={!pageSearch}
                            onNavigate={() => {
                              handlePageListOpenChange(false)
                              if (realIdx !== currentIndex) {
                                navigate(realIdx, realIdx > currentIndex ? 'next' : 'prev')
                              }
                            }}
                          />
                        )
                      })
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Popup pagination controls */}
              {showPopoverPagination && (
                <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/10">
                  <button
                    type="button"
                    disabled={popoverPage === 0}
                    onClick={() => setPopoverPage(p => p - 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {popoverPage + 1} / {popoverTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={popoverPage >= popoverTotalPages - 1}
                    onClick={() => setPopoverPage(p => p + 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost" size="sm" className="h-7 gap-1 text-xs"
            onClick={() => navigate(currentIndex + 1, 'next')} disabled={!canNext}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Main content area ── */}
      {reorderMode ? (
        /* Dedicated reorder view */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pagedReorderLogs.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto">
              {pagedReorderLogs.map((log, pageIdx) => {
                const realIdx = reorderPage * REORDER_PAGE_SIZE + pageIdx
                return (
                  <SortablePageRow
                    key={log.id}
                    log={log}
                    index={realIdx}
                    isActive={realIdx === currentIndex}
                    totalCount={localLogs.length}
                    onMoveToPosition={(targetIdx) => handleMoveToPosition(log.id, targetIdx)}
                  />
                )
              })}
            </div>
            {reorderTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-2 border-t shrink-0 bg-muted/20">
                <Button
                  variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                  disabled={reorderPage === 0}
                  onClick={() => setReorderPage(p => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Page {reorderPage + 1} of {reorderTotalPages}
                </span>
                <Button
                  variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                  disabled={reorderPage >= reorderTotalPages - 1}
                  onClick={() => setReorderPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </SortableContext>
        </DndContext>
      ) : (
        /* Normal editor view — animated on page navigation */
        <div
          key={flipKey}
          style={animStyle}
          className="flex-1 overflow-hidden flex flex-col min-h-0"
        >
          {currentLog ? (
            <>
              <RichEditor
                key={currentLog.id}
                value={content}
                onChange={handleContentChange}
                fullHeight
                showColorToggle
                showFontSizeToggle
                fontSize={logbookFontSize}
                onFontSizeChange={handleFontSizeChange}
                onImageUpload={handleImageUpload}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No pages in this {terms.logbook.toLowerCase()}.
            </div>
          )}
        </div>
      )}

      {/* ── Add page confirmation dialog ── */}
      <AlertDialog open={showAddPageDialog} onOpenChange={setShowAddPageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add new page</AlertDialogTitle>
            <AlertDialogDescription>
              {isDirty
                ? 'You have unsaved changes on this page. Would you like to save before adding a new page?'
                : `Add a new page to this ${terms.logbook.toLowerCase()}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAddPageDialog(false)}>
              Cancel
            </AlertDialogCancel>
            {isDirty && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9"
                onClick={() => { setShowAddPageDialog(false); doAddPage(false) }}
              >
                Add without saving
              </Button>
            )}
            <AlertDialogAction
              onClick={() => { setShowAddPageDialog(false); doAddPage(isDirty) }}
            >
              {isDirty ? 'Save & Add Page' : 'Add Page'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Unsaved changes dialog ── */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this page. Save before navigating?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowUnsavedDialog(false); setPendingNavTarget(null) }}>
              Stay
            </AlertDialogCancel>
            <Button variant="destructive" size="sm" onClick={handleUnsavedDiscard}>
              Discard
            </Button>
            <AlertDialogAction onClick={handleUnsavedSave}>
              Save &amp; Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete page confirmation ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this page? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
