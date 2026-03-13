'use client'

import { useEffect, useState } from 'react'
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
  FormDescription,
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
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { useRouter } from 'next/navigation'
import { saveLog } from '@/actions/logs'
import { createTrail, createMarker } from '@/actions/waypoints'

const MARKER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
]

const logSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(),
  waypointId: z.string().optional(),
  tagIds: z.array(z.string()),
})

type LogFormValues = z.infer<typeof logSchema>

interface LogDrawerProps {
  open: boolean
  onClose: () => void
  log?: any
  folders: any[]
  waypoints: any[]
  tags: any[]
  defaultFolderId?: string | null
  defaultWaypointId?: string | null
}

export function LogDrawer({
  open,
  onClose,
  log,
  folders,
  waypoints,
  tags,
  defaultFolderId,
  defaultWaypointId,
}: LogDrawerProps) {
  const router = useRouter()
  const { saving, saved, error, handleSubmit } = useFormStatus()

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

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      content: log?.content ?? '',
      folderId: log?.folderId ?? defaultFolderId ?? '',
      waypointId: log?.waypointId ?? defaultWaypointId ?? '',
      tagIds: log?.tags?.map((t: any) => t.tagId) ?? [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        content: log?.content ?? '',
        folderId: log?.folderId ?? defaultFolderId ?? '',
        waypointId: log?.waypointId ?? defaultWaypointId ?? '',
        tagIds: log?.tags?.map((t: any) => t.tagId) ?? [],
      })
    }
  }, [open, log])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      setCreatingTrail(false)
      setNewTrailName('')
      setCreatingMarker(false)
      setNewMarkerName('')
      setNewMarkerColor(MARKER_COLORS[4])
      onClose()
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
      form.setValue('waypointId', '')
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

  async function onSubmit(values: LogFormValues) {
    await handleSubmit(async () => {
      await saveLog({
        id: log?.id,
        content: values.content,
        folderId: values.folderId || null,
        waypointId: values.waypointId || null,
        tagIds: values.tagIds,
      })
      form.reset()
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
  const selectedTrailId = form.watch('folderId')
  const selectedWaypointId = form.watch('waypointId')

  // Filter waypoints to selected trail if one is chosen
  const filteredWaypoints = selectedTrailId && selectedTrailId !== 'none'
    ? waypoints.filter(w => w.folderId === selectedTrailId)
    : waypoints

  useEffect(() => {
    if (selectedWaypointId && selectedWaypointId !== 'none') {
      const waypoint = waypoints.find(w => w.id === selectedWaypointId)
      if (waypoint?.folderId) {
        form.setValue('folderId', waypoint.folderId)
      }
    }
  }, [selectedWaypointId])

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{log ? 'Edit Log Entry' : 'New Log Entry'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form
              id="log-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write your note..."
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
                      onValueChange={val => {
                        field.onChange(val === 'none' ? '' : val)
                        form.setValue('waypointId', '')
                      }}
                      value={field.value || 'none'}
                      disabled={!!selectedWaypointId && selectedWaypointId !== 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full overflow-hidden [&_span]:truncate [&_span]:block">
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
                    <FormDescription>
                      {selectedWaypointId && selectedWaypointId !== 'none'
                        ? 'Trail is set by the selected waypoint.'
                        : 'Choosing a trail filters the waypoints below.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Waypoint — filtered by trail */}
              <FormField
                control={form.control}
                name="waypointId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waypoint</FormLabel>
                    <Select
                      onValueChange={val => field.onChange(val === 'none' ? '' : val)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full overflow-hidden [&_span]:truncate [&_span]:block">
                          <SelectValue placeholder="No waypoint" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No waypoint</SelectItem>
                        {filteredWaypoints.map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

        {/* Footer */}
        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={log ? 'Save Changes' : 'Add Entry'}
            formId="log-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
