import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
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

export function createDraftId(): string {
  return `draft-${crypto.randomUUID()}`
}

export function ManifestListInspector<T extends { id: string }>({
  sectionLabel,
  helpKind = 'metadata',
  items,
  selectedId,
  creating,
  emptyItem,
  canSave,
  deleteTitle,
  deleteDescription,
  onChange,
  onSelect,
  onCreatingChange,
  onSaved,
  saveItem,
  deleteItem,
  renderFields,
}: {
  sectionLabel: string
  helpKind?: 'notes' | 'metadata'
  items: T[]
  selectedId: string | null
  creating: boolean
  emptyItem: () => T
  canSave: (item: T) => boolean
  deleteTitle: string
  deleteDescription: string
  onChange: (items: T[]) => void
  onSelect: (id: string | null) => void
  onCreatingChange: (creating: boolean) => void
  onSaved: () => void
  saveItem: (item: T) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  renderFields: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  const selected = creating
    ? items.find((item) => item.id === selectedId) ?? emptyItem()
    : selectedId
      ? items.find((item) => item.id === selectedId) ?? null
      : null
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const savedSnapshotRef = useRef<string | null>(null)

  const helpText =
    helpKind === 'notes'
      ? 'Notes and descriptions save here. Other text edits live on the canvas.'
      : 'Edit descriptions on the canvas. Metadata fields save here.'

  useEffect(() => {
    if (!selected) {
      savedSnapshotRef.current = null
      return
    }
    savedSnapshotRef.current = JSON.stringify(selected)
  }, [selectedId, creating])

  useEffect(() => {
    if (!selected || !canSave(selected)) return
    if (creating && !items.some((item) => item.id === selected.id)) return

    const snapshot = JSON.stringify(selected)
    if (savedSnapshotRef.current === snapshot) return

    const timer = window.setTimeout(() => {
      setSaving(true)
      void saveItem(selected)
        .then(() => {
          savedSnapshotRef.current = snapshot
          onSaved()
          toast.success('Saved')
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : `Failed to save ${sectionLabel}`)
        })
        .finally(() => setSaving(false))
    }, 700)

    return () => window.clearTimeout(timer)
  }, [canSave, creating, items, onSaved, saveItem, sectionLabel, selected])

  function updateSelected(patch: Partial<T>) {
    if (!selected) return
    const next = items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item))
    if (creating && !items.some((item) => item.id === selected.id)) {
      onChange([...items, { ...selected, ...patch }])
      onSelect(selected.id)
      return
    }
    onChange(next)
  }

  async function handleDelete() {
    if (!selected || selected.id.startsWith('draft-')) {
      onCreatingChange(false)
      onSelect(null)
      setDeleteOpen(false)
      return
    }
    setSaving(true)
    try {
      await deleteItem(selected.id)
      onChange(items.filter((item) => item.id !== selected.id))
      onSelect(null)
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to delete ${sectionLabel}`)
    } finally {
      setSaving(false)
      setDeleteOpen(false)
    }
  }

  if (!selected) {
    return (
      <div className="flex h-full flex-col">
        <InspectorChrome>
          <InspectorChromeTitle eyebrow={sectionLabel} title="Inspector" />
        </InspectorChrome>
        <div className="flex flex-1 items-center justify-center px-5 text-center text-sm text-muted-foreground">
          Select an entry on the canvas to edit.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <InspectorChrome>
        <InspectorChromeTitle
          eyebrow={sectionLabel}
          title={creating ? `New ${sectionLabel}` : `Edit ${sectionLabel}`}
        />
      </InspectorChrome>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-xs text-muted-foreground">{helpText}</p>
        {renderFields(selected, updateSelected)}
      </div>
      {!creating || saving ? (
        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-4">
          {saving ? <p className="text-center text-xs text-muted-foreground">Saving…</p> : null}
          {!creating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
