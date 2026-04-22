'use client'

import { useState } from 'react'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
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
import { useTerminology } from '@/contexts/terminology-context'
import { saveStone, deleteStone } from '@/actions/guides'

type StoneWithMarkers = {
  id: string
  face: string
  core: string
  placement: 'UNPLACED' | 'PLACED' | 'SET' | 'SEATED'
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

interface StoneFormProps {
  stone: StoneWithMarkers | null
  guideId: string
  markers: { id: string; name: string; color: string; icon: string | null }[]
  onBack: () => void
  onSaved: () => void
  onDeleted: () => void
}

export function StoneForm({ stone, guideId, markers, onBack, onSaved, onDeleted }: StoneFormProps) {
  const { terms } = useTerminology()
  const [face, setFace] = useState(stone?.face ?? '')
  const [core, setCore] = useState(stone?.core ?? '')
  const [markerIds, setMarkerIds] = useState<string[]>(stone?.markers.map(m => m.markerId) ?? [])
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function toggleMarker(id: string) {
    setMarkerIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!face.trim() || !core.trim()) return
    await handleSubmit(async () => {
      await saveStone({ id: stone?.id, face: face.trim(), core: core.trim(), guideId, markerIds })
      onSaved()
    })
  }

  async function handleDelete() {
    if (!stone) return
    setDeleting(true)
    try {
      await deleteStone(stone.id)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {stone ? `Edit ${terms.stone}` : `Add ${terms.stone}`}
          </span>
        </div>
        {stone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive/80"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove {terms.stone.toLowerCase()}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form id="stone-form" onSubmit={onSubmit} className="space-y-4">
          {/* Stone Face */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{terms.stoneFace}</label>
            <Textarea
              value={face}
              onChange={e => setFace(e.target.value)}
              placeholder={`Enter the ${terms.stoneFace.toLowerCase()}…`}
              rows={4}
              autoFocus
            />
          </div>

          {/* Stone Core */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{terms.stoneCore}</label>
            <Textarea
              value={core}
              onChange={e => setCore(e.target.value)}
              placeholder={`Enter the ${terms.stoneCore.toLowerCase()}…`}
              rows={4}
            />
          </div>

          {/* Markers */}
          {markers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{terms.markers}</label>
              <div className="flex flex-wrap gap-2">
                {markers.map(marker => (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => toggleMarker(marker.id)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full text-white transition-opacity ${
                      markerIds.includes(marker.id) ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-40'
                    }`}
                    style={{
                      backgroundColor: marker.color,
                      ['--tw-ring-color' as any]: marker.color,
                    }}
                  >
                    {marker.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="-mx-4 border-t" />
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={stone ? 'Save Changes' : `Add ${terms.stone}`}
            formId="stone-form"
            onCancel={onBack}
          />
        </form>
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.stone}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this {terms.stone.toLowerCase()}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
