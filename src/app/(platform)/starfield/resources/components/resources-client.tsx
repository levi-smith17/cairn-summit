'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Search, X } from 'lucide-react'
import { ResourceList } from './resource-list'
import { ResourceInfo } from './resource-detail'
import { ResourceForm } from './resource-form'
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
  totalCount: number
  currentPage: number
  pageSize: number
}

export function ResourcesClient({ resources, resourceTypes, totalCount, currentPage, pageSize }: ResourcesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view')
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
    setMode('view')
  }

  function clearResource() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('resource')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleAdd() {
    setEditingResource(null)
    setMode('add')
  }

  function handleEdit(resource: any) {
    setEditingResource(resource)
    setMode('edit')
  }

  function handleFormDone() {
    setMode('view')
    setEditingResource(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteResource(deleteTarget.id)
    if (selectedResourceId === deleteTarget.id) clearResource()
    setDeleteTarget(null)
  }

  const showForm = mode === 'add' || mode === 'edit'

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
          <div className={`${(selectedResource || showForm) ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 rounded-lg border border-border bg-card overflow-hidden`}>
            <ResourceList
              resources={filteredResources}
              resourceTypes={resourceTypes}
              selectedResourceId={selectedResourceId}
              onSelect={selectResource}
              onNew={handleAdd}
              onEdit={handleEdit}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              isSearching={!!search.trim()}
            />
          </div>
          <div className={`${(selectedResource || showForm) ? 'flex' : 'hidden md:flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden`}>
            {showForm ? (
              <ResourceForm
                key={editingResource?.id ?? 'new'}
                resource={editingResource}
                resources={resources}
                resourceTypes={resourceTypes}
                onDone={handleFormDone}
              />
            ) : (
              <ResourceInfo
                resource={selectedResource}
                onBack={clearResource}
                onEdit={handleEdit}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteTarget?.name}"? This cannot be undone.
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
