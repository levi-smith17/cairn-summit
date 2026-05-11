import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { FacilityList } from './facility-list'
import { FacilityDetail } from './facility-detail'
import { FacilityForm } from './facility-form'
import { FacilityResourceForm } from './facility-resource-form'
import { Search, X } from 'lucide-react'
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
import { deleteFacility, deleteFacilityResource } from '@/lib/api/starfield'

type Mode = 'view' | 'add-facility' | 'edit-facility' | 'add-resource' | 'edit-resource'

interface FacilitiesClientProps {
  facilities: any[]
  resources: any[]
  systems: any[]
  onRefresh: () => void
}

export function FacilitiesClient({ facilities, resources, systems, onRefresh }: FacilitiesClientProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<Mode>('view')
  const [editingFacility, setEditingFacility] = useState<any>(null)
  const [editingResource, setEditingResource] = useState<any>(null)
  const [defaultFacilityId, setDefaultFacilityId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'facility' | 'resource'; id: string; name: string } | null>(null)

  const filteredFacilities = useMemo(() => {
    if (!search.trim()) return facilities
    const q = search.toLowerCase()
    return facilities
      .map(facility => {
        const facilityMatches =
          facility.name.toLowerCase().includes(q) ||
          facility.abbreviation.toLowerCase().includes(q) ||
          facility.planet.name.toLowerCase().includes(q) ||
          facility.planet.system.name.toLowerCase().includes(q)
        const matchingResources = facility.resources.filter((fr: any) =>
          fr.resource.name.toLowerCase().includes(q) ||
          fr.resource.abbreviation.toLowerCase().includes(q) ||
          fr.planet.name.toLowerCase().includes(q) ||
          fr.planet.system.name.toLowerCase().includes(q) ||
          fr.subfacility1?.name.toLowerCase().includes(q) ||
          fr.subfacility2?.name.toLowerCase().includes(q) ||
          fr.subfacility3?.name.toLowerCase().includes(q) ||
          fr.relay?.name.toLowerCase().includes(q)
        )
        if (facilityMatches) return { ...facility, _forceOpen: true }
        if (matchingResources.length > 0) return { ...facility, resources: matchingResources, _forceOpen: true }
        return null
      })
      .filter(Boolean)
  }, [facilities, search])

  const selectedFacilityId = searchParams.get('facility')
  const selectedFacility = filteredFacilities.find((f: any) => f.id === selectedFacilityId) ?? null

  function selectFacility(id: string) {
    const next = new URLSearchParams(searchParams)
    next.set('facility', id)
    setSearchParams(next, { preventScrollReset: true })
    setMode('view')
  }

  function clearFacility() {
    const next = new URLSearchParams(searchParams)
    next.delete('facility')
    setSearchParams(next, { preventScrollReset: true })
  }

  function handleAddFacility() { setEditingFacility(null); setMode('add-facility') }
  function handleEditFacility(facility: any) { setEditingFacility(facility); setMode('edit-facility') }
  function handleAddResource(facilityId: string) { setEditingResource(null); setDefaultFacilityId(facilityId); setMode('add-resource') }
  function handleEditResource(resource: any) { setEditingResource(resource); setDefaultFacilityId(null); setMode('edit-resource') }
  function handleFormDone() { setMode('view'); setEditingFacility(null); setEditingResource(null); setDefaultFacilityId(null) }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'facility') {
      await deleteFacility(deleteTarget.id)
      if (selectedFacilityId === deleteTarget.id) clearFacility()
    } else {
      await deleteFacilityResource(deleteTarget.id)
    }
    onRefresh()
    setDeleteTarget(null)
  }

  const showForm = mode !== 'view'
  const showRight = !!selectedFacility || showForm

  return (
    <>
      <PlatformHeader title="Starfield — Facilities" />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-2 h-8 rounded-md border border-input px-3 text-sm w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search facilities, resources, planets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className={`${showRight ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <FacilityList facilities={filteredFacilities} selectedFacilityId={selectedFacilityId} onSelect={selectFacility} onNew={handleAddFacility} onEdit={handleEditFacility} onDelete={(id, name) => setDeleteTarget({ type: 'facility', id, name })} />
          </div>
          <div className={`${showRight ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
            {mode === 'add-facility' || mode === 'edit-facility' ? (
              <FacilityForm key={editingFacility?.id ?? 'new'} facility={editingFacility} systems={systems} onDone={handleFormDone} onRefresh={onRefresh} />
            ) : mode === 'add-resource' || mode === 'edit-resource' ? (
              <FacilityResourceForm key={editingResource?.id ?? defaultFacilityId ?? 'new'} facilityResource={editingResource} facilities={facilities} resources={resources} systems={systems} defaultFacilityId={defaultFacilityId} onDone={handleFormDone} onRefresh={onRefresh} />
            ) : (
              <FacilityDetail facility={selectedFacility} onBack={clearFacility} onAddResource={handleAddResource} onEditResource={handleEditResource} onDeleteResource={(id, name) => setDeleteTarget({ type: 'resource', id, name })} />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.type === 'facility' ? 'Remove Facility' : 'Remove Resource'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteTarget?.name}"?
              {deleteTarget?.type === 'facility' && ' All resources in this facility will also be removed.'}
              {' '}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
