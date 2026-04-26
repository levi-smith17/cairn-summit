'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, Loader2, Plus, Trash2, X } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveWaypoint, deleteWaypoint, createTrail, createMarker } from '@/actions/waypoints'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'

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

interface WaypointFormProps {
  waypoint: any | null
  folders: any[]
  tags: any[]
  onBack: () => void
  onSaved: (id: string) => void
  onDeleted: () => void
}

export function WaypointForm({ waypoint, folders, tags, onBack, onSaved, onDeleted }: WaypointFormProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [fetching, setFetching] = useState(false)
  const [favicon, setFavicon] = useState<string | null>(waypoint?.favicon ?? null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Local copies for optimistic inline creation
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
      folderId: waypoint?.trailId ?? '',
      tagIds: waypoint?.markers?.map((t: any) => t.markerId) ?? [],
    },
  })

  const selectedMarkerIds = form.watch('tagIds')

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
      const result = await saveWaypoint({
        id: waypoint?.id,
        title: values.title,
        url: values.url,
        description: values.description || null,
        notes: values.notes || null,
        favicon,
        trailId: values.folderId || null,
        markerIds: values.tagIds,
      })
      router.refresh()
      onSaved(result.id)
      onBack()
    })
  }

  async function handleDelete() {
    if (!waypoint) return
    setDeleting(true)
    await deleteWaypoint(waypoint.id)
    router.refresh()
    onDeleted()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {waypoint ? `Edit ${terms.waypoints.slice(0, -1)}` : `Add ${terms.waypoints.slice(0, -1)}`}
          </span>
        </div>
        {waypoint && (
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
            <TooltipContent>
              Remove {terms.waypoints.slice(0, -1).toLowerCase()}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="waypoint-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* URL + Fetch */}
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
                      {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
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
                      <Input placeholder={`${terms.waypoints.slice(0, -1)} title`} {...field} />
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
                    <Textarea placeholder="Optional description..." className="resize-none" rows={2} {...field} />
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
                    <Textarea placeholder="Private notes..." className="resize-none" rows={2} {...field} />
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
                    <FormLabel>{terms.trails.slice(0, -1)}</FormLabel>
                    {!creatingTrail && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-xs px-2"
                        onClick={() => setCreatingTrail(true)}
                      >
                        <Plus className="h-3 w-3" />
                        Add {terms.trails.slice(0, -1).toLowerCase()}
                      </Button>
                    )}
                  </div>
                  <CustomSelect
                    options={[
                      { value: 'none', label: `No ${terms.trails.slice(0, -1).toLowerCase()}` },
                      ...localTrails.map((f: any) => ({ value: f.id, label: f.name })),
                    ]}
                    value={field.value || 'none'}
                    onChange={val => field.onChange(val === 'none' ? '' : val)}
                    placeholderValue="none"
                    triggerClassName="w-full"
                  />
                  {creatingTrail && (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newTrailName}
                        onChange={e => setNewTrailName(e.target.value)}
                        placeholder={`${terms.trails.slice(0, -1)} name`}
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
                        {trailCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
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
                    <FormLabel>{terms.markers}</FormLabel>
                    {!creatingMarker && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-xs px-2"
                        onClick={() => setCreatingMarker(true)}
                      >
                        <Plus className="h-3 w-3" />
                        Add {terms.markers.slice(0, -1).toLowerCase()}
                      </Button>
                    )}
                  </div>
                  {localMarkers.length > 0 && (
                    <MarkerPicker
                      markers={localMarkers}
                      selected={selectedMarkerIds}
                      onChange={ids => form.setValue('tagIds', ids)}
                      placeholder={`Select ${terms.markers.toLowerCase()}…`}
                    />
                  )}
                  {creatingMarker && (
                    <div className="flex flex-col gap-2 p-2 border rounded-md">
                      <Input
                        value={newMarkerName}
                        onChange={e => setNewMarkerName(e.target.value)}
                        placeholder={`${terms.markers.slice(0, -1)} name`}
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
                          Add {terms.markers.slice(0, -1).toLowerCase()}
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

            {/* Actions */}
            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={waypoint ? `Save Changes` : `Add ${terms.waypoints.slice(0, -1)}`}
              formId="waypoint-form"
              onCancel={onBack}
            />
          </form>
        </Form>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.waypoints.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{waypoint?.title}&quot;? This cannot be undone.
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
