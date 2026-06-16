import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FilterBar } from '@/components/filters/filter-bar'
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
import { useTerminology } from '@/contexts/terminology-context'
import { parseFiltersFromParams, applySignalFilters } from '@/lib/filters'
import { deleteSignal } from '@/lib/api/signals'
import type { Signal } from '@/lib/api/signals'
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
  const [showSettings, setShowSettings] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const parsed = parseFiltersFromParams(searchParams)
  const filters = {
    ...parsed,
    sort: searchParams.has('sort') ? parsed.sort : 'newest' as const,
  }
  const filteredSignals = applySignalFilters(signals, filters)

  const selectedId = searchParams.get('id')
  const selectedSignal = filteredSignals.find(s => s.id === selectedId)
    ?? signals.find(s => s.id === selectedId)
    ?? null
  const showRight = selectedId !== null || showSettings

  function selectSignal(id: string) {
    setShowSettings(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    setSearchParams(params)
  }

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    setSearchParams(params)
  }

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
      <PlatformHeader title={terms.signals} />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <FilterBar
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
            <div className="hidden md:block flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showSettings ? 'secondary' : 'ghost'}
                  size="icon"
                  className="hidden md:flex h-8 w-8 shrink-0"
                  onClick={() => {
                    setShowSettings(v => !v)
                    if (!showSettings) clearSelection()
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{terms.signals} settings</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className={`${showRight ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <SignalList
              signals={filteredSignals}
              selectedId={selectedId}
              showSnippets={signalSettings.showSnippets}
              onSelect={selectSignal}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          </div>

          <div className={`${showRight ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
            {showSettings ? (
              <div className="flex-1 overflow-y-auto p-6">
                <SignalsSettingsForm defaultValues={signalSettings} />
              </div>
            ) : selectedSignal ? (
              <SignalDetail signal={selectedSignal} autoMarkRead={signalSettings.autoMarkRead} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground p-6 text-center">
                Select a {terms.signal.toLowerCase()} to read and reply
              </div>
            )}
          </div>
        </div>
      </div>

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
