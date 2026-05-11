import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { saveWaypoint } from '@/lib/api/waypoints'
import { useFormStatus } from '@/hooks/use-form-status'
import { useTerminology } from '@/contexts/terminology-context'

const API_BASE = import.meta.env.VITE_API_URL

const schema = z.object({
  url: z.string().url('Must be a valid URL'),
  title: z.string().min(1, 'Title is required'),
  folderId: z.string().optional(),
  tagIds: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface InlineWaypointFormProps {
  waypoint?: any
  defaultFolderId?: string | null
  folders: any[]
  tags: any[]
  onCancel: () => void
  onSaved: () => void
}

export function InlineWaypointForm({
  waypoint,
  defaultFolderId,
  folders,
  tags,
  onCancel,
  onSaved,
}: InlineWaypointFormProps) {
  const { terms } = useTerminology()
  const { saving, handleSubmit } = useFormStatus()
  const [fetching, setFetching] = useState(false)
  const [favicon, setFavicon] = useState<string | null>(waypoint?.favicon ?? null)
  const [localFolders, setLocalFolders] = useState(folders)
  const [localMarkers, setLocalMarkers] = useState(tags)
  useEffect(() => setLocalFolders(folders), [folders])
  useEffect(() => setLocalMarkers(tags), [tags])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: waypoint?.url ?? '',
      title: waypoint?.title ?? '',
      folderId: waypoint?.trailId ?? defaultFolderId ?? '',
      tagIds: waypoint?.markers?.map((t: any) => t.markerId) ?? [],
    },
  })

  const selectedMarkerIds = form.watch('tagIds')

  async function fetchMeta() {
    const url = form.getValues('url')
    if (!url) return
    setFetching(true)
    try {
      const res = await fetch(`${API_BASE}/fetch-url-meta?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.title) form.setValue('title', data.title)
      if (data.favicon) setFavicon(data.favicon)
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveWaypoint({
        id: waypoint?.id,
        title: values.title,
        url: values.url,
        favicon,
        trailId: values.folderId || null,
        markerIds: values.tagIds,
      })
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col bg-muted/20 border-b">
      <div className="flex flex-col p-4 gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="https://..."
            className="h-8 text-sm flex-1"
            {...form.register('url')}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={fetchMeta}
            disabled={fetching}
          >
            {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Fetch'}
          </Button>
        </div>
        {form.formState.errors.url && (
          <p className="text-xs text-destructive">{form.formState.errors.url.message}</p>
        )}

        <div className="flex items-center gap-2">
          {favicon && (
            <img
              src={favicon}
              alt=""
              className="h-4 w-4 rounded shrink-0"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
          <Input
            placeholder="Title"
            className="h-8 text-sm flex-1"
            {...form.register('title')}
          />
        </div>
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}

        <CustomSelect
          options={[
            { value: 'none', label: `No ${terms.trails.slice(0, -1).toLowerCase()}` },
            ...localFolders.map((f: any) => ({ value: f.id, label: f.name })),
          ]}
          value={form.watch('folderId') || 'none'}
          onChange={val => form.setValue('folderId', val === 'none' ? '' : val)}
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

      <div className="flex flex-col md:flex-row flex-col-reverse justify-end gap-2 border-t p-4">
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          {waypoint ? 'Save Changes' : `Add ${terms.waypoints.slice(0, -1)}`}
        </Button>
      </div>
    </form>
  )
}
