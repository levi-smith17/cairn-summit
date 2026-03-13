'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Loader2, Plus, X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { useRouter } from 'next/navigation'
import { saveWaypoint, createTrail, createMarker } from '@/actions/waypoints'

const MARKER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
]

const waypointSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  notes: z.string().optional(),
  folderId: z.string().optional(),
  tagIds: z.array(z.string()),
})

type WaypointFormValues = z.infer<typeof waypointSchema>

interface WaypointDrawerProps {
  open: boolean
  onClose: () => void
  waypoint?: any
  folders: any[]
  tags: any[]
  defaultFolderId?: string | null
}

export function WaypointDrawer({
  open,
  onClose,
  waypoint,
  folders,
  tags,
  defaultFolderId,
}: WaypointDrawerProps) {
  const router = useRouter()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [fetching, setFetching] = useState(false)
  const [favicon, setFavicon] = useState<string | null>(waypoint?.favicon ?? null)

  // Local copies so inline creation updates are visible immediately
  const [localTrails, setLocalTrails] = useState(folders)
  const [localMarkers, setLocalMarkers] = useState(tags)
  useEffect(() => { setLocalTrails(folders) }, [folders])
  useEffect(() => { setLocalMarkers(tags) }, [tags])

  // Inline trail creation
  const [creatingTrail, setCreatingTrail] = useState(false)
  const [newTrailName, setNewTrailName] = useState('')
  const [trailCreating, setTrailCreating] = useState(false)

  // Inline marker creation
  const [creatingMarker, setCreatingMarker] = useState(false)
  const [newMarkerName, setNewMarkerName] = useState('')
  const [newMarkerColor, setNewMarkerColor] = useState(MARKER_COLORS[4])
  const [markerCreating, setMarkerCreating] = useState(false)

  const form = useForm<WaypointFormValues>({
    resolver: zodResolver(waypointSchema),
    defaultValues: {
      title: waypoint?.title ?? '',
      url: waypoint?.url ?? '',
      description: waypoint?.description ?? '',
      notes: waypoint?.notes ?? '',
      folderId: waypoint?.folderId ?? defaultFolderId ?? '',
      tagIds: waypoint?.tags?.map((t: any) => t.tagId) ?? [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: waypoint?.title ?? '',
        url: waypoint?.url ?? '',
        description: waypoint?.description ?? '',
        notes: waypoint?.notes ?? '',
        folderId: waypoint?.folderId ?? defaultFolderId ?? '',
        tagIds: waypoint?.tags?.map((t: any) => t.tagId) ?? [],
      })
      setFavicon(waypoint?.favicon ?? null)
    }
  }, [open, waypoint])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      setFavicon(null)
      setCreatingTrail(false)
      setNewTrailName('')
      setCreatingMarker(false)
      setNewMarkerName('')
      setNewMarkerColor(MARKER_COLORS[4])
      onClose()
    }
  }

  async function fetchMeta() {
    const url = form.getValues('url')
    if (!url) return
    try {
      setFetching(true)
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

  async function handleCreateTrail() {
    const name = newTrailName.trim()
    if (!name) return
    setTrailCreating(true)
    try {
      const trail = await createTrail(name)
      setLocalTrails(prev => [...prev, trail])
      form.setValue('folderId', trail.id)
      setCreatingTrail(false)
      setNewTrailName('')
    } finally {
      setTrailCreating(false)
    }
  }

  async function handleCreateMarker() {
    const name = newMarkerName.trim()
    if (!name) return
    setMarkerCreating(true)
    try {
      const marker = await createMarker({ name, color: newMarkerColor })
      setLocalMarkers(prev => [...prev, marker])
      const current = form.getValues('tagIds')
      form.setValue('tagIds', [...current, marker.id])
      setCreatingMarker(false)
      setNewMarkerName('')
      setNewMarkerColor(MARKER_COLORS[4])
    } finally {
      setMarkerCreating(false)
    }
  }

  async function onSubmit(values: WaypointFormValues) {
    await handleSubmit(async () => {
      await saveWaypoint({
        id: waypoint?.id,
        title: values.title,
        url: values.url,
        description: values.description || null,
        notes: values.notes || null,
        favicon,
        folderId: values.folderId || null,
        tagIds: values.tagIds,
      })
      form.reset()
      setFavicon(null)
      router.refresh()
      onClose()
    })
  }

  function toggleMarker(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue(
      'tagIds',
      current.includes(tagId)
        ? current.filter(id => id !== tagId)
        : [...current, tagId]
    )
  }

  const selectedMarkerIds = form.watch('tagIds')

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{waypoint ? 'Edit Waypoint' : 'New Waypoint'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form
              id="waypoint-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* URL + fetch */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={fetchMeta}
                        disabled={fetching}
                      >
                        {fetching
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : 'Fetch'}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <div className="flex items-center gap-2">
                      {favicon && (
                        <img
                          src={favicon}
                          alt=""
                          className="h-5 w-5 rounded shrink-0"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <FormControl>
                        <Input placeholder="Page title" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Private notes..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Trail */}
              <FormField
                control={form.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Trail</FormLabel>
                      {!creatingTrail && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs px-2"
                          onClick={() => setCreatingTrail(true)}
                        >
                          <Plus className="h-3 w-3" />
                          New trail
                        </Button>
                      )}
                    </div>
                    <Select
                      onValueChange={val => field.onChange(val === 'none' ? '' : val)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No trail" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No trail</SelectItem>
                        {localTrails.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {creatingTrail && (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newTrailName}
                          onChange={e => setNewTrailName(e.target.value)}
                          placeholder="Trail name"
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreateTrail() }
                            if (e.key === 'Escape') { setCreatingTrail(false); setNewTrailName('') }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={handleCreateTrail}
                          disabled={!newTrailName.trim() || trailCreating}
                        >
                          {trailCreating
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Check className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => { setCreatingTrail(false); setNewTrailName('') }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Markers */}
              <FormField
                control={form.control}
                name="tagIds"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Markers</FormLabel>
                      {!creatingMarker && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs px-2"
                          onClick={() => setCreatingMarker(true)}
                        >
                          <Plus className="h-3 w-3" />
                          New marker
                        </Button>
                      )}
                    </div>
                    {localMarkers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {localMarkers.map(marker => (
                          <button
                            key={marker.id}
                            type="button"
                            onClick={() => toggleMarker(marker.id)}
                            className={`rounded-full transition-opacity ${selectedMarkerIds.includes(marker.id)
                                ? 'opacity-100 ring-2 ring-offset-1'
                                : 'opacity-50'
                              }`}
                            style={{
                              ['--tw-ring-color' as any]: marker.color,
                            }}
                          >
                            <MarkerBadge marker={marker} />
                          </button>
                        ))}
                      </div>
                    )}
                    {creatingMarker && (
                      <div className="flex flex-col gap-2 p-2 border rounded-md">
                        <Input
                          value={newMarkerName}
                          onChange={e => setNewMarkerName(e.target.value)}
                          placeholder="Marker name"
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Escape') { setCreatingMarker(false); setNewMarkerName('') }
                          }}
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {MARKER_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              className={`h-5 w-5 rounded-full ring-offset-1 transition-all ${newMarkerColor === color ? 'ring-2 scale-110' : ''}`}
                              style={{ backgroundColor: color, ['--tw-ring-color' as any]: color }}
                              onClick={() => setNewMarkerColor(color)}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleCreateMarker}
                            disabled={!newMarkerName.trim() || markerCreating}
                          >
                            {markerCreating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Add marker
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setCreatingMarker(false); setNewMarkerName(''); setNewMarkerColor(MARKER_COLORS[4]) }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={waypoint ? 'Save Changes' : 'Add Waypoint'}
            formId="waypoint-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
