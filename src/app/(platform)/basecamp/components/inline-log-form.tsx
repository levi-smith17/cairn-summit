'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { saveLog } from '@/actions/logs'
import { useFormStatus } from '@/hooks/use-form-status'
import { useTerminology } from '@/contexts/terminology-context'


const schema = z.object({
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(),
  waypointId: z.string().optional(),
  tagIds: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface InlineLogFormProps {
  log?: any
  defaultFolderId?: string | null
  defaultWaypointId?: string | null
  folders: any[]
  waypoints: any[]
  tags: any[]
  onCancel: () => void
  onSaved: () => void
}

export function InlineLogForm({
  log,
  defaultFolderId,
  defaultWaypointId,
  folders,
  waypoints,
  tags,
  onCancel,
  onSaved,
}: InlineLogFormProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const { saving, handleSubmit } = useFormStatus()
  const [localMarkers, setLocalMarkers] = useState(tags)
  useEffect(() => setLocalMarkers(tags), [tags])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      content: log?.content ?? '',
      folderId: log?.trailId ?? defaultFolderId ?? '',
      waypointId: log?.waypointId ?? defaultWaypointId ?? '',
      tagIds: log?.markers?.map((t: any) => t.markerId) ?? [],
    },
  })

  const selectedMarkerIds = form.watch('tagIds')
  const selectedFolderId = form.watch('folderId')

  const filteredWaypoints = selectedFolderId && selectedFolderId !== 'none'
    ? waypoints.filter(w => w.trailId === selectedFolderId)
    : waypoints

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveLog({
        id: log?.id,
        content: values.content,
        trailId: values.folderId || null,
        waypointId: values.waypointId || null,
        markerIds: values.tagIds,
      })
      router.refresh()
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col bg-muted/20 border-b">
      <div className="flex flex-col p-4 gap-2">
        {/* Rich text editor */}
        <RichTextEditor
          value={form.watch('content')}
          onChange={val => form.setValue('content', val)}
          placeholder="Write your entry..."
        />
        {form.formState.errors.content && (
          <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
        )}

        {/* Trail + Waypoint + Markers */}
        <div className="flex flex-col gap-2">
          {!defaultWaypointId && (
            <CustomSelect
              options={[
                { value: 'none', label: `No ${terms.trails.slice(0, -1).toLowerCase()}` },
                ...folders.map((f: any) => ({ value: f.id, label: f.name })),
              ]}
              value={form.watch('folderId') || 'none'}
              onChange={val => {
                form.setValue('folderId', val === 'none' ? '' : val)
                form.setValue('waypointId', '')
              }}
              placeholderValue="none"
              triggerClassName="w-full h-7 text-xs"
            />
          )}

          <CustomSelect
            options={[
              { value: 'none', label: `No ${terms.waypoints.slice(0, -1).toLowerCase()}` },
              ...filteredWaypoints.map((w: any) => ({ value: w.id, label: w.title })),
            ]}
            value={form.watch('waypointId') || 'none'}
            onChange={val => form.setValue('waypointId', val === 'none' ? '' : val)}
            placeholderValue="none"
            triggerClassName="w-full h-7 text-xs"
          />

          <MarkerPicker
            markers={localMarkers}
            selected={selectedMarkerIds}
            onChange={ids => form.setValue('tagIds', ids)}
            placeholder="Markers"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row flex-col-reverse justify-end gap-2 p-4 border-t">
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          {log ? 'Save Changes' : `Add ${terms.logs.slice(0, -1)}`}
        </Button>
      </div>
    </form>
  )
}
