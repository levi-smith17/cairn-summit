'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { saveWaypoint } from '@/actions/waypoints'
import { useFormStatus } from '@/hooks/use-form-status'
import { useTerminology } from '@/contexts/terminology-context'

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
  const router = useRouter()
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
      const res = await fetch(`/api/fetch-url-meta?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.title) form.setValue('title', data.title)
      if (data.favicon) setFavicon(data.favicon)
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  function toggleMarker(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue(
      'tagIds',
      current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId]
    )
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
      router.refresh()
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4 py-3 bg-muted/20 border-t">
      {/* URL + Fetch */}
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

      {/* Title */}
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

      {/* Trail + Markers */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          onValueChange={val => form.setValue('folderId', val === 'none' ? '' : val)}
          value={form.watch('folderId') || 'none'}
        >
          <SelectTrigger className="h-7 text-xs w-40">
            <SelectValue placeholder={`No ${terms.trails.slice(0, -1).toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No {terms.trails.slice(0, -1).toLowerCase()}</SelectItem>
            {localFolders.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
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
          {waypoint ? 'Save Changes' : `Add ${terms.waypoints.slice(0, -1)}`}
        </Button>
      </div>
    </form>
  )
}
