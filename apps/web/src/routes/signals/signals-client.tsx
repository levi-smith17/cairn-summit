import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Button } from '@/components/ui/button'
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

  const selectedId = searchParams.get('id')
  const selectedSignal = signals.find(s => s.id === selectedId) ?? null
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
        <div className="flex items-center justify-end shrink-0">
          <Button
            variant={showSettings ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 text-sm"
            onClick={() => {
              setShowSettings(v => !v)
              if (!showSettings) clearSelection()
            }}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Button>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className={`${showRight ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <SignalList
              signals={signals}
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
