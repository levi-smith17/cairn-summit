'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { StudioDataToolbar } from '@/components/studio/layout/studio-data-toolbar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MobileFilterBar } from '@/components/filters/mobile-filter-bar'
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
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { useTerminology } from '@/contexts/terminology-context'
import { parseFiltersFromParams, applySignalFilters } from '@/lib/filters'
import { deleteSignal } from '@/lib/api/signals'
import type { Signal } from '@/lib/api/signals'
import { cn } from '@/lib/utils'
import { SignalList } from './signal-list'
import { SignalDetail } from './signal-detail'
import { SignalsSettingsForm } from './signals-settings-form'

interface SignalsClientProps {
  signals: Signal[]
  signalSettings: {
    messagesPerPage: number
    autoMarkRead: boolean
    autoRefreshInterval: number
    compactView: boolean
    showSnippets: boolean
    browserNotifications: boolean
    notificationSound: boolean
  }
}

export function SignalsClient({ signals, signalSettings }: SignalsClientProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { terms } = useTerminology()
  const { pinned: inspectorPinned } = useInspectorPin()
  const [showSettings, setShowSettings] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const parsed = parseFiltersFromParams(searchParams)
  const filters = {
    ...parsed,
    sort: searchParams.has('sort') ? parsed.sort : 'newest' as const,
  }
  const filteredSignals = applySignalFilters(signals, filters)
  const unreadCount = signals.filter(s => !s.read).length

  const selectedId = searchParams.get('id')
  const selectedSignal = filteredSignals.find(s => s.id === selectedId)
    ?? signals.find(s => s.id === selectedId)
    ?? null

  const inspectorOpen = inspectorPinned || selectedId !== null || showSettings
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  function selectSignal(id: string) {
    setShowSettings(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    setSearchParams(params)
  }

  const clearSelection = useCallback(() => {
    setShowSettings(false)
    setSearchParams(params => {
      const next = new URLSearchParams(params)
      next.delete('id')
      return next
    })
  }, [setSearchParams])

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (inspectorPinned || selectedId == null) return
      const target = event.target as HTMLElement
      if (target.closest('[data-inspectable]')) return
      clearSelection()
    },
    [inspectorPinned, selectedId, clearSelection],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && (selectedId || showSettings)) {
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, selectedId, showSettings, clearSelection])

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteSignal(deleteTarget.id)
    queryClient.invalidateQueries({ queryKey: ['signals'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    if (selectedId === deleteTarget.id) clearSelection()
    setDeleteTarget(null)
  }

  return (
    <>
      <StudioLayout
        contextBar={
          <PlatformStudioContextBar
            aria-label={`${terms.signals} header`}
            title={terms.signals}
            subtitle="Contact-form messages"
            metadata={
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs',
                  unreadCount > 0
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : `${signals.length} ${signals.length === 1 ? 'message' : 'messages'}`}
              </span>
            }
            actions={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={showSettings ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setShowSettings(v => {
                        if (!v) clearSelection()
                        return !v
                      })
                    }}
                    aria-label={`${terms.signals} settings`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{terms.signals} settings</TooltipContent>
              </Tooltip>
            }
          />
        }
        canvas={
          <div className="flex h-full flex-col" onPointerDown={handleCanvasPointerDown}>
            <StudioDataToolbar
              trailing={
                <MobileFilterBar
                  showMarkerFilter={false}
                  showTrailFilter={false}
                  showSort
                  showUnreadOnly
                  showDateRange
                  sortOptions={[
                    { value: 'newest', label: 'Newest' },
                    { value: 'oldest', label: 'Oldest' },
                    { value: 'alpha', label: 'A–Z' },
                  ]}
                  searchPlaceholder={`${terms.explore} ${terms.signals.toLowerCase()}...`}
                  fill
                />
              }
            />
            <div className="min-h-0 flex-1 overflow-hidden" data-inspectable>
              <SignalList
                signals={filteredSignals}
                selectedId={selectedId}
                showSnippets={signalSettings.showSnippets}
                onSelect={selectSignal}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            </div>
          </div>
        }
        inspectorState={inspectorState}
        inspectorHint={`Select a ${terms.signal.toLowerCase()}`}
        inspector={
          showSettings ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {terms.signals} settings
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <SignalsSettingsForm defaultValues={signalSettings} />
              </div>
            </div>
          ) : selectedSignal ? (
            <SignalDetail signal={selectedSignal} autoMarkRead={signalSettings.autoMarkRead} />
          ) : inspectorPinned ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inspector
                </p>
              </div>
              <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
                Select a {terms.signal.toLowerCase()} to read and reply.
              </p>
            </div>
          ) : null
        }
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {terms.signal.toLowerCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the conversation with {deleteTarget?.name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
