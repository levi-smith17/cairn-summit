'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Search, X } from 'lucide-react'
import { ResourceList } from './resource-list'
import { ResourceInfo } from './resource-detail'
import { ResourceDrawer } from './drawers/resource-drawer'
import { deleteResource } from '@/actions/starfield'
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

interface ResourcesClientProps {
  resources: any[]
  resourceTypes: any[]
}

export function ResourcesClient({ resources, resourceTypes }: ResourcesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const filteredResources = useMemo(() => {
    if (!search.trim()) return resources
    const q = search.toLowerCase()
    return resources.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.abbreviation.toLowerCase().includes(q) ||
      r.type.name.toLowerCase().includes(q)
    )
  }, [resources, search])

  const selectedResourceId = searchParams.get('resource')
  const selectedResource = filteredResources.find(r => r.id === selectedResourceId) ?? null

  function selectResource(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('resource', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function clearResource() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('resource')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleAdd() {
    setEditingResource(null)
    setDrawerOpen(true)
  }

  function handleEdit(resource: any) {
    setEditingResource(resource)
    setDrawerOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteResource(deleteTarget.id)
    if (selectedResourceId === deleteTarget.id) clearResource()
    setDeleteTarget(null)
  }

  return (
    <>
      <PlatformHeader title="Starfield — Resources" />

      <div className="flex flex-col flex-1 gap-4 p-4 overflow-hidden min-h-0">
        <div className="rounded-lg border border-border bg-card p-2 shrink-0">
          <div className="flex items-center gap-2 h-8 rounded-md border border-input px-3 text-sm w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search resources..."
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
          <div className={`${selectedResource ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <ResourceList
              resources={filteredResources}
              resourceTypes={resourceTypes}
              selectedResourceId={selectedResourceId}
              onSelect={selectResource}
              onNew={handleAdd}
              onEdit={handleEdit}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          </div>
          <div className={`${selectedResource ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
            <ResourceInfo
              resource={selectedResource}
              onBack={clearResource}
              onEdit={handleEdit}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
            />
          </div>
        </div>
      </div>

      <ResourceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resource={editingResource}
        resources={resources}
        resourceTypes={resourceTypes}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
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
