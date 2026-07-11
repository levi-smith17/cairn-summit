import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import { InspectorFormActions } from '@/components/studio/ui/inspector-form-actions'
import { CatalogInspector } from '@/components/studio/catalog/catalog-inspector'
import { deleteBurn, deleteCache, deleteSupplyline } from '@/lib/api/supplylines'
import { useTerminology } from '@/contexts/terminology-context'
import { markerShortLabel } from '@/lib/utils'
import { InlineBurnForm } from './inline-burn-form'
import { InlineSupplylineForm } from './inline-supplyline-form'
import { InlineCacheForm } from './inline-cache-form'
import { CacheCarryInspector } from './cache-carry-inspector'
import type { Burn } from './burn-row'
import type { Supplyline } from './supplyline-row'
import type { BudgetUtilization } from './cache-row'
import type { ProvisionsMarker, ProvisionsSelection } from './provisions-types'

const BURN_FORM_ID = 'provisions-burn-form'
const SUPPLYLINE_FORM_ID = 'provisions-supplyline-form'
const CACHE_FORM_ID = 'provisions-cache-form'

export function ProvisionsInspector({
  selection,
  markers,
  month,
  year,
  burn,
  supplyline,
  cache,
  targetMarkerIds,
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
  targetMarkerIds: Set<string>
  onSaved: () => void
  onDeleted: () => void
  onCancel: () => void
}) {
  const { terms } = useTerminology()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (selection.kind === 'cache-carry') {
    return (
      <CacheCarryInspector
        targetMonth={month}
        targetYear={year}
        targetMarkerIds={targetMarkerIds}
        markers={markers}
        onComplete={() => {
          onSaved()
          onCancel()
        }}
      />
    )
  }

  if (selection.kind === 'catalog') {
    return <CatalogInspector onClose={onCancel} />
  }

  const title =
    selection.kind === 'burn'
      ? burn?.name ?? terms.burn
      : selection.kind === 'supplyline'
        ? supplyline?.name ?? terms.supplyline
        : selection.kind === 'cache' || selection.kind === 'cache-marker'
          ? markerShortLabel(cache?.marker?.name, terms.cache)
          : selection.kind === 'new-burn'
            ? `New ${terms.burn.toLowerCase()}`
            : selection.kind === 'new-supplyline'
              ? `New ${terms.supplyline.toLowerCase()}`
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

  const formId = showBurnForm
    ? BURN_FORM_ID
    : showSupplylineForm
      ? SUPPLYLINE_FORM_ID
      : showCacheForm
        ? CACHE_FORM_ID
        : null

  const isNew =
    selection.kind === 'new-burn' ||
    selection.kind === 'new-supplyline' ||
    selection.kind === 'new-cache' ||
    selection.kind === 'cache-marker'

  const createLabel =
    selection.kind === 'new-burn'
      ? `Add ${terms.burn}`
      : selection.kind === 'new-supplyline'
        ? `Add ${terms.supplyline}`
        : `Add ${terms.cache}`

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
      </InspectorChrome>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showBurnForm ? (
          <InlineBurnForm
            burn={burn}
            defaultMarkerId={selection.kind === 'new-burn' ? selection.markerId : undefined}
            tags={markers}
            formId={BURN_FORM_ID}
            onSaved={onSaved}
          />
        ) : null}

        {showSupplylineForm ? (
          <InlineSupplylineForm
            supplyline={supplyline}
            tags={markers}
            formId={SUPPLYLINE_FORM_ID}
            onSaved={onSaved}
          />
        ) : null}

        {showCacheForm ? (
          <InlineCacheForm
            cache={
              cache
                ? {
                    id: cache.id,
                    markerId: cache.markerId,
                    limit: cache.limit,
                    spent: cache.spent,
                    utilization: cache.utilization,
                  }
                : undefined
            }
            defaultMarkerId={selection.kind === 'cache-marker' ? selection.markerId : undefined}
            markers={markers}
            month={month}
            year={year}
            formId={CACHE_FORM_ID}
            onSaved={onSaved}
          />
        ) : null}
      </div>

      {formId ? (
        <InspectorFormActions
          isNew={isNew}
          formId={formId}
          createLabel={createLabel}
          saveLabel="Save changes"
          showDelete={canDelete}
          deleteLabel={`Delete ${eyebrow.toLowerCase()}`}
          onDelete={() => setConfirmDelete(true)}
        />
      ) : null}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {eyebrow.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
