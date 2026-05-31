import { useState, useMemo, useEffect } from 'react'
import { X, ArrowLeft, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import { ResourceList } from './resource-list'
import { ResourceForm } from './resource-form'
import { SF_CONTROL, SF_ICON_CONTROL } from './constants'
import { deleteResource } from '@/lib/api/starfield'

interface ResourcesPanelProps {
  resources: any[]
  onClose: () => void
  onRefresh: () => void
}

type SubMode =
  | { mode: 'list' }
  | { mode: 'detail'; resource: any }
  | { mode: 'form'; resource: any | null }

const PAGE_SIZE = 25

export function ResourcesPanel({ resources, onClose, onRefresh }: ResourcesPanelProps) {
  const [subMode, setSubMode] = useState<SubMode>({ mode: 'list' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const sortedResources = useMemo(() =>
    [...resources].sort((a, b) => {
      const typeA = (a.type ?? '').localeCompare(b.type ?? '')
      if (typeA !== 0) return typeA
      return a.name.localeCompare(b.name)
    }), [resources])

  const filteredResources = useMemo(() => search.trim()
    ? sortedResources.filter(r =>
        (r.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.abbreviation ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.type ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : sortedResources, [sortedResources, search])

  useEffect(() => { setPage(1) }, [search])

  const isSearching = !!search.trim()
  const pagedResources = isSearching
    ? filteredResources
    : filteredResources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteResource(deleteTarget.id)
    if (subMode.mode === 'detail' && subMode.resource?.id === deleteTarget.id) {
      setSubMode({ mode: 'list' })
    }
    onRefresh()
    setDeleteTarget(null)
  }

  if (subMode.mode === 'form') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={() => setSubMode({ mode: 'list' })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {subMode.resource?.id ? 'Edit Resource' : 'Add Resource'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {subMode.resource?.id && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${SF_ICON_CONTROL} text-destructive hover:text-destructive/80`}
                    onClick={() => setDeleteTarget({ id: subMode.resource.id, name: subMode.resource.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete resource</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <ResourceForm
          key={subMode.resource?.id ?? 'new'}
          resource={subMode.resource}
          resources={resources}
          onDone={() => setSubMode({ mode: 'list' })}
          onRefresh={onRefresh}
        />
      </div>
    )
  }

  if (subMode.mode === 'detail') {
    const resource = subMode.resource
    const ingredients = (resource.ingredients ?? [])
      .map((id: string) => resources.find((r: any) => r.id === id || r.sk === `RESOURCE#${id}`))
      .filter(Boolean)

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={() => setSubMode({ mode: 'list' })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{resource.name}</span>
                <Badge variant="outline" className="text-xs">{resource.abbreviation}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{resource.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={() => setSubMode({ mode: 'form', resource })}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={() => setDeleteTarget({ id: resource.id, name: resource.name })}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {ingredients.length > 0 && (
            <div className="border-b border-border">
              <div className="px-4 py-2 bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipe</span>
              </div>
              {ingredients.map((ing: any) => (
                <div key={ing.id ?? ing.sk} className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 text-sm">
                  <Badge variant="outline" className="text-xs font-mono">{ing.abbreviation}</Badge>
                  <span>{ing.name}</span>
                </div>
              ))}
            </div>
          )}
          {ingredients.length === 0 && (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              No recipe — mined or raw resource.
            </div>
          )}
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
      </div>
    )
  }

  const displayCount = isSearching ? filteredResources.length : resources.length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">
          {displayCount} resource{displayCount !== 1 ? 's' : ''}
          {isSearching && filteredResources.length < resources.length && (
            <span className="text-xs text-muted-foreground ml-1">(filtered)</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={SF_ICON_CONTROL}
                onClick={() => setSubMode({ mode: 'form', resource: null })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add resource</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close panel</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className={`pl-8 pr-8 ${SF_CONTROL} text-sm`}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ResourceList
          resources={pagedResources}
          selectedResourceId={null}
          onSelect={id => {
            const resource = resources.find(r => (r.id ?? r.sk) === id)
            if (resource) setSubMode({ mode: 'detail', resource })
          }}
          onNew={() => setSubMode({ mode: 'form', resource: null })}
          onEdit={resource => setSubMode({ mode: 'form', resource })}
          totalCount={filteredResources.length}
          currentPage={page}
          pageSize={PAGE_SIZE}
          isSearching={isSearching}
          onPageChange={setPage}
          onNewWithType={type => setSubMode({ mode: 'form', resource: { type } })}
          allResources={resources}
          hideHeader
        />
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
    </div>
  )
}
