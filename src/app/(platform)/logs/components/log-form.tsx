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
import { saveLog, deleteLog } from '@/actions/logs'
import { createTrail, createMarker } from '@/actions/waypoints'
import { useTerminology } from '@/contexts/terminology-context'
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

interface LogItem {
  id: string
  content: string
  folderId: string | null
  waypointId: string | null
  tags: { tagId: string }[]
}

interface LogFormProps {
  log: LogItem | null
  folders: any[]
  waypoints: any[]
  tags: any[]
  onBack: () => void
  onSaved: (id: string) => void
  onDeleted: () => void
}

export function LogForm({ log, folders, waypoints, tags, onBack, onSaved, onDeleted }: LogFormProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
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

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      content: log?.content ?? '',
      folderId: log?.folderId ?? '',
      waypointId: log?.waypointId ?? '',
      tagIds: log?.tags?.map(t => t.tagId) ?? [],
    },
  })

  const selectedMarkerIds = form.watch('tagIds')
  const selectedTrailId = form.watch('folderId')
  const selectedWaypointId = form.watch('waypointId')

  // Filter waypoints by selected trail
  const filteredWaypoints = selectedTrailId && selectedTrailId !== 'none'
    ? waypoints.filter(w => w.folderId === selectedTrailId)
    : waypoints

  // Auto-set trail when waypoint is chosen
  useEffect(() => {
    if (selectedWaypointId && selectedWaypointId !== 'none') {
      const waypoint = waypoints.find(w => w.id === selectedWaypointId)
      if (waypoint?.folderId) {
        form.setValue('folderId', waypoint.folderId)
      }
    }
  }, [selectedWaypointId])

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

  function toggleMarker(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue(
      'tagIds',
      current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId]
    )
  }

  async function onSubmit(values: LogFormValues) {
    await handleSubmit(async () => {
      const result = await saveLog({
        id: log?.id,
        content: values.content,
        folderId: values.folderId || null,
        waypointId: values.waypointId || null,
        tagIds: values.tagIds,
      })
      router.refresh()
      onSaved(result.id)
      onBack()
    })
  }

  async function handleDelete() {
    if (!log) return
    setDeleting(true)
    await deleteLog(log.id)
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
            {log ? `Edit ${terms.logs.slice(0, -1)}` : `Add ${terms.logs.slice(0, -1)}`}
          </span>
        </div>
        {log && (
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
              Remove {terms.logs.slice(0, -1).toLowerCase()}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="log-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                      placeholder="Write your entry..."
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
                    <FormLabel>{terms.trails.slice(0, -1)}</FormLabel>
                    {!creatingTrail && !selectedWaypointId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-xs px-2"
                        onClick={() => setCreatingTrail(true)}
                      >
                        <Plus className="h-3 w-3" />
                        New {terms.trails.slice(0, -1).toLowerCase()}
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
                        <SelectValue placeholder={`No ${terms.trails.slice(0, -1).toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No {terms.trails.slice(0, -1).toLowerCase()}</SelectItem>
                      {localTrails.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormDescription>
                    {selectedWaypointId && selectedWaypointId !== 'none'
                      ? `${terms.trails.slice(0, -1)} is set by the selected ${terms.waypoints.slice(0, -1).toLowerCase()}.`
                      : `Choosing a ${terms.trails.slice(0, -1).toLowerCase()} filters the ${terms.waypoints.toLowerCase()} below.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Waypoint */}
            <FormField
              control={form.control}
              name="waypointId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{terms.waypoints.slice(0, -1)}</FormLabel>
                  <Select
                    onValueChange={val => field.onChange(val === 'none' ? '' : val)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full overflow-hidden [&_span]:truncate [&_span]:block">
                        <SelectValue placeholder={`No ${terms.waypoints.slice(0, -1).toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No {terms.waypoints.slice(0, -1).toLowerCase()}</SelectItem>
                      {filteredWaypoints.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
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
                        New {terms.markers.slice(0, -1).toLowerCase()}
                      </Button>
                    )}
                  </div>
                  {localMarkers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {localMarkers.map((marker: any) => (
                        <button
                          key={marker.id}
                          type="button"
                          onClick={() => toggleMarker(marker.id)}
                          className={`rounded-full transition-opacity ${selectedMarkerIds.includes(marker.id) ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-50'
                            }`}
                          style={{ ['--tw-ring-color' as any]: marker.color }}
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
              saveLabel={log ? `Save Changes` : `Add ${terms.logs.slice(0, -1)}`}
              formId="log-form"
              onCancel={onBack}
            />
          </form>
        </Form>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.logs.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this log? This cannot be undone.
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
