'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
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
      folderId: log?.folderId ?? defaultFolderId ?? '',
      waypointId: log?.waypointId ?? defaultWaypointId ?? '',
      tagIds: log?.tags?.map((t: any) => t.tagId) ?? [],
    },
  })

  const selectedMarkerIds = form.watch('tagIds')
  const selectedFolderId = form.watch('folderId')

  const filteredWaypoints = selectedFolderId && selectedFolderId !== 'none'
    ? waypoints.filter(w => w.folderId === selectedFolderId)
    : waypoints

  function toggleMarker(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue(
      'tagIds',
      current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId]
    )
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveLog({
        id: log?.id,
        content: values.content,
        folderId: values.folderId || null,
        waypointId: values.waypointId || null,
        tagIds: values.tagIds,
      })
      router.refresh()
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4 py-3 bg-muted/20 border-t">
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
      <div className="flex flex-wrap gap-2 items-center">
        {!defaultWaypointId && (
          <Select
            onValueChange={val => {
              form.setValue('folderId', val === 'none' ? '' : val)
              form.setValue('waypointId', '')
            }}
            value={form.watch('folderId') || 'none'}
          >
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue placeholder={`No ${terms.trails.slice(0, -1).toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No {terms.trails.slice(0, -1).toLowerCase()}</SelectItem>
              {folders.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          onValueChange={val => form.setValue('waypointId', val === 'none' ? '' : val)}
          value={form.watch('waypointId') || 'none'}
        >
          <SelectTrigger className="h-7 text-xs w-40">
            <SelectValue placeholder={`No ${terms.waypoints.slice(0, -1).toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No {terms.waypoints.slice(0, -1).toLowerCase()}</SelectItem>
            {filteredWaypoints.map((w: any) => (
              <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {localMarkers.map((marker: any) => (
          <button
            key={marker.id}
            type="button"
            onClick={() => toggleMarker(marker.id)}
            className={`rounded-full transition-opacity ${selectedMarkerIds.includes(marker.id) ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-40'}`}
            style={{ ['--tw-ring-color' as any]: marker.color }}
          >
            <MarkerBadge marker={marker} />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
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
