'use client'

import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { SystemList } from './system-list'
import { SystemDetail } from './system-detail'
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
import { deleteSystem, deletePlanet } from '@/actions/starfield'

interface SystemsClientProps {
  systems: any[]
}

export function SystemsClient({ systems }: SystemsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedSystemId = searchParams.get('system')
  const selectedSystem = systems.find(s => s.id === selectedSystemId) ?? null

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'system' | 'planet'; id: string; name: string } | null>(null)

  function selectSystem(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('system', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearSystem() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('system')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'system') {
      await deleteSystem(deleteTarget.id)
      if (selectedSystemId === deleteTarget.id) clearSystem()
    } else {
      await deletePlanet(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <PlatformHeader title="Starfield — Systems" />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className={`
          ${selectedSystem ? 'hidden md:flex' : 'flex'}
          flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden
        `}>
          <SystemList
            systems={systems}
            selectedSystemId={selectedSystemId}
            onSelect={selectSystem}
            onDelete={(id, name) => setDeleteTarget({ type: 'system', id, name })}
          />
        </div>

        <div className={`
          ${selectedSystem ? 'flex' : 'hidden md:flex'}
          flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden
        `}>
          <SystemDetail
            system={selectedSystem}
            onBack={clearSystem}
            onDeletePlanet={(id, name) => setDeleteTarget({ type: 'planet', id, name })}
          />
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'system' ? 'Remove System' : 'Remove Planet'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteTarget?.name}"?
              {deleteTarget?.type === 'system' && ' All planets in this system will also be removed.'}
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
