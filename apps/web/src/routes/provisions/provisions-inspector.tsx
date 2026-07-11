import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
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
import { InspectorChrome, InspectorChromeTitle } from '@/components/studio/ui/inspector-chrome'
import { carryOverCache, deleteBurn, deleteCache, deleteSupplyline } from '@/lib/api/supplylines'
import { useTerminology } from '@/contexts/terminology-context'
import { InlineBurnForm } from './inline-burn-form'
import { InlineSupplylineForm } from './inline-supplyline-form'
import { InlineCacheForm } from './inline-cache-form'
import type { Burn } from './burn-row'
import type { Supplyline } from './supplyline-row'
import type { BudgetUtilization } from './cache-row'
import type { ProvisionsMarker, ProvisionsSelection } from './provisions-types'

export function ProvisionsInspector({
  selection,
  markers,
  month,
  year,
  burn,
  supplyline,
  cache,
  onSaved,
  onDeleted,
  onCancel,
}: {
  selection: ProvisionsSelection
  markers: ProvisionsMarker[]
  month: number
  year: number
  burn?: Burn
  supplyline?: Supplyline
  cache?: BudgetUtilization
  onSaved: () => void
  onDeleted: () => void
  onCancel: () => void
}) {
  const { terms } = useTerminology()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [carrying, setCarrying] = useState(false)

  if (selection.kind === 'cache-carry') {
    return (
      <div className="flex h-full flex-col">
        <InspectorChrome>
          <InspectorChromeTitle
            eyebrow={terms.cache}
            title="Copy from last month"
          />
        </InspectorChrome>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Copy {terms.cache.toLowerCase()} allocations from the previous month into{' '}
            {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={carrying}
            onClick={async () => {
              setCarrying(true)
              try {
                await carryOverCache({ month, year })
                onSaved()
                onCancel()
              } finally {
                setCarrying(false)
              }
            }}
          >
            {carrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Copy'}
          </Button>
        </div>
      </div>
    )
  }

  const title =
    selection.kind === 'burn'
      ? burn?.name ?? terms.burn
      : selection.kind === 'supplyline'
        ? supplyline?.name ?? terms.supplylines
        : selection.kind === 'cache' || selection.kind === 'cache-marker'
          ? cache?.marker.name ?? terms.cache
          : selection.kind === 'new-burn'
            ? `New ${terms.burn.toLowerCase()}`
            : selection.kind === 'new-supplyline'
              ? `New ${terms.supplylines.toLowerCase()}`
              : `New ${terms.cache.toLowerCase()}`

  const eyebrow =
    selection.kind === 'burn' || selection.kind === 'new-burn'
      ? terms.burn
      : selection.kind === 'supplyline' || selection.kind === 'new-supplyline'
        ? terms.supplylines
        : terms.cache

  const showBurnForm = selection.kind === 'new-burn' || selection.kind === 'burn'
  const showSupplylineForm = selection.kind === 'new-supplyline' || selection.kind === 'supplyline'
  const showCacheForm =
    selection.kind === 'new-cache' ||
    selection.kind === 'cache' ||
    selection.kind === 'cache-marker'

  const canDelete =
    selection.kind === 'burn' || selection.kind === 'supplyline' || selection.kind === 'cache'

  async function handleDelete() {
    setDeleting(true)
    try {
      if (selection.kind === 'burn') await deleteBurn(selection.id)
      else if (selection.kind === 'supplyline') await deleteSupplyline(selection.id)
      else if (selection.kind === 'cache') await deleteCache(selection.id)
      onDeleted()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={eyebrow} title={title} />
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </InspectorChrome>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showBurnForm ? (
          <InlineBurnForm
            burn={burn}
            defaultMarkerId={selection.kind === 'new-burn' ? selection.markerId : undefined}
            tags={markers}
            onSaved={onSaved}
            onCancel={onCancel}
          />
        ) : null}

        {showSupplylineForm ? (
          <InlineSupplylineForm
            supplyline={supplyline}
            tags={markers}
            onSaved={onSaved}
            onCancel={onCancel}
          />
        ) : null}

        {showCacheForm ? (
          <InlineCacheForm
            cache={
              cache
                ? { id: cache.id, markerId: cache.markerId, limit: cache.limit, spent: cache.spent, utilization: cache.utilization }
                : undefined
            }
            defaultMarkerId={selection.kind === 'cache-marker' ? selection.markerId : undefined}
            markers={markers}
            month={month}
            year={year}
            onSaved={onSaved}
            onCancel={onCancel}
          />
        ) : null}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {eyebrow.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
