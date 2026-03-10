'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/nav/page-header'
import { Button } from '@/components/ui/button'
import { HeaderNavActions } from '@/components/nav/header-nav-actions'
import { Database, Factory, Globe, Plus } from 'lucide-react'
import { SystemList } from './system-list'
import { SystemDetail } from './system-detail'
import { SystemDrawer } from './drawers/system-drawer'
import { PlanetDrawer } from './drawers/planet-drawer'
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

  const [systemDrawerOpen, setSystemDrawerOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<any>(null)
  const [planetDrawerOpen, setPlanetDrawerOpen] = useState(false)
  const [editingPlanet, setEditingPlanet] = useState<any>(null)
  const [defaultSystemId, setDefaultSystemId] = useState<string | null>(null)
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

  function handleAddPlanet(systemId: string) {
    setEditingPlanet(null)
    setDefaultSystemId(systemId)
    setPlanetDrawerOpen(true)
  }

  function handleEditPlanet(planet: any) {
    setEditingPlanet(planet)
    setDefaultSystemId(null)
    setPlanetDrawerOpen(true)
  }

  function handleEditSystem(system: any) {
    setEditingSystem(system)
    setSystemDrawerOpen(true)
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
      <PageHeader
        title="Starfield — Systems"
        actions={
          <HeaderNavActions
            navActions={[
              { label: 'Facilities', href: '/starfield/facilities', icon: Factory },
              { label: 'Resources', href: '/starfield/resources', icon: Database },
            ]}
            primaryAction={
              <Button
                size="sm"
                onClick={() => { setEditingSystem(null); setSystemDrawerOpen(true) }}
              >
                <Plus className="h-4 w-4 mr-1" /> System
              </Button>
            }
          />
        }
      />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Mobile: show detail if system selected, otherwise show list */}
        {/* Desktop: always show both */}

        {/* Left column — system list */}
        <div className={`
          ${selectedSystem ? 'hidden md:flex' : 'flex'}
          flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden
        `}>
          <SystemList
            systems={systems}
            selectedSystemId={selectedSystemId}
            onSelect={selectSystem}
            onEdit={handleEditSystem}
            onDelete={(id, name) => setDeleteTarget({ type: 'system', id, name })}
            onAddPlanet={handleAddPlanet}
          />
        </div>

        {/* Right column — planet detail */}
        <div className={`
          ${selectedSystem ? 'flex' : 'hidden md:flex'}
          flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden
        `}>
          <SystemDetail
            system={selectedSystem}
            onBack={clearSystem}
            onEditPlanet={handleEditPlanet}
            onDeletePlanet={(id, name) => setDeleteTarget({ type: 'planet', id, name })}
            onAddPlanet={handleAddPlanet}
          />
        </div>
      </div>

      <SystemDrawer
        open={systemDrawerOpen}
        onClose={() => setSystemDrawerOpen(false)}
        system={editingSystem}
      />

      <PlanetDrawer
        open={planetDrawerOpen}
        onClose={() => setPlanetDrawerOpen(false)}
        planet={editingPlanet}
        systems={systems}
        defaultSystemId={defaultSystemId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'system' ? 'Delete System' : 'Delete Planet'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === 'system' && ' All planets in this system will also be deleted.'}
              {' '}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}