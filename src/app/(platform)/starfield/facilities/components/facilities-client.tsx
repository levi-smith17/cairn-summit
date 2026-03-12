'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Button } from '@/components/ui/button'
import { FacilityDrawer } from './drawers/facility-drawer'
import { FacilityList } from './facility-list'
import { FacilityResourceDrawer } from './drawers/facility-resource-drawer'
import { HeaderNavActions } from '@/components/nav/header-nav-actions'
import { Database, Globe, Plus, Search, X } from 'lucide-react'
import { FacilityDetail } from './facility-detail'
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
import { deleteFacility, deleteFacilityResource } from '@/actions/starfield'
import { useSearchParams } from 'next/navigation'

interface FacilitiesClientProps {
  facilities: any[]
  resources: any[]
  systems: any[]
}

export function FacilitiesClient({ facilities, resources, systems }: FacilitiesClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [facilityDrawerOpen, setFacilityDrawerOpen] = useState(false)
  const [editingFacility, setEditingFacility] = useState<any>(null)
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)
  const [defaultFacilityId, setDefaultFacilityId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'facility' | 'resource'; id: string; name: string } | null>(null)

  const filteredFacilities = useMemo(() => {
    if (!search.trim()) return facilities
    const q = search.toLowerCase()
    return facilities
      .map(facility => {
        // Check if facility itself matches
        const facilityMatches =
          facility.name.toLowerCase().includes(q) ||
          facility.abbreviation.toLowerCase().includes(q) ||
          facility.planet.name.toLowerCase().includes(q) ||
          facility.planet.system.name.toLowerCase().includes(q)

        // Filter resources that match
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

  const searchParams = useSearchParams()
  const selectedFacilityId = searchParams.get('facility')
  const selectedFacility = filteredFacilities.find((f: any) => f.id === selectedFacilityId) ?? null

  function selectFacility(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('facility', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearFacility() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('facility')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleAddResource(facilityId: string) {
    setEditingResource(null)
    setDefaultFacilityId(facilityId)
    setResourceDrawerOpen(true)
  }

  function handleEditResource(resource: any) {
    setEditingResource(resource)
    setDefaultFacilityId(null)
    setResourceDrawerOpen(true)
  }

  function handleEditFacility(facility: any) {
    setEditingFacility(facility)
    setFacilityDrawerOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'facility') {
      await deleteFacility(deleteTarget.id)
    } else {
      await deleteFacilityResource(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <PlatformHeader
        title="Starfield — Facilities"
        filters={
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
        }
        actions={
          <HeaderNavActions
            navActions={[
              { label: 'Systems', href: '/starfield/systems', icon: Globe },
              { label: 'Resources', href: '/starfield/resources', icon: Database },
            ]}
            primaryAction={
              <Button
                size="sm"
                onClick={() => { setEditingFacility(null); setFacilityDrawerOpen(true) }}
              >
                <Plus className="h-4 w-4 mr-1" /> Facility
              </Button>
            }
          />
        }
      />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Left column — facility list */}
        <div className={`${selectedFacility ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
          <FacilityList
            facilities={filteredFacilities}
            selectedFacilityId={selectedFacilityId}
            onSelect={selectFacility}
            onEdit={handleEditFacility}
            onDelete={(id, name) => setDeleteTarget({ type: 'facility', id, name })}
          />
        </div>

        {/* Right column — resource detail */}
        <div className={`${selectedFacility ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
          <FacilityDetail
            facility={selectedFacility}
            onBack={clearFacility}
            onAddResource={handleAddResource}
            onEditResource={handleEditResource}
            onDeleteResource={(id, name) => setDeleteTarget({ type: 'resource', id, name })}
          />
        </div>
      </div>


      <FacilityDrawer
        open={facilityDrawerOpen}
        onClose={() => setFacilityDrawerOpen(false)}
        facility={editingFacility}
        systems={systems}
      />

      <FacilityResourceDrawer
        open={resourceDrawerOpen}
        onClose={() => setResourceDrawerOpen(false)}
        facilityResource={editingResource}
        facilities={facilities}
        resources={resources}
        systems={systems}
        defaultFacilityId={defaultFacilityId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'facility' ? 'Delete Facility' : 'Remove Resource'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {deleteTarget?.type === 'facility' ? 'delete' : 'remove'} "{deleteTarget?.name}"?
              {deleteTarget?.type === 'facility' && ' All resources in this facility will be deleted.'} This cannot be undone.
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