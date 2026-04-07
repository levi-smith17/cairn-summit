'use client'

import { useState } from 'react'
import { contrastColor } from '@/lib/color'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Trash2, MapPin, RefreshCw } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveStop, deleteStop, deleteICloudEventDirect, deleteStopOccurrence } from '@/actions/itinerary'
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
import { RecurrencePicker } from './recurrence-picker'
import { rruleLabel } from '@/lib/recurrence'
import type { RecurrenceScope } from './recurrence-dialog'
import type { StopWithMarkers, MarkerOption, ICloudEventDisplay, CalendarOption } from './itinerary-client'

function toLocalDateTimeString(date: Date): string {
  const y  = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  const h  = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${mi}`
}

function toLocalDateString(date: Date): string {
  const y  = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

const stopSchema = z.object({
  title:     z.string().min(1, 'Title is required'),
  notes:     z.string().optional(),
  location:  z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate:   z.string().optional(),
  allDay:    z.boolean(),
  markerIds: z.array(z.string()),
})

type StopFormValues = z.infer<typeof stopSchema>

interface StopFormProps {
  stop: StopWithMarkers | null
  initialDate: Date | null
  icloudSeed?: ICloudEventDisplay | null
  markers: MarkerOption[]
  calendars: CalendarOption[]
  /** Date of the specific occurrence being edited (null = edit master / new stop). */
  occurrenceDate?: Date | null
  /** Which occurrences to affect when saving. */
  occurrenceScope?: RecurrenceScope | null
  /** Master stop ID when editing a single occurrence. */
  masterId?: string | null
  onClose: () => void
}

export function StopForm({
  stop,
  initialDate,
  icloudSeed,
  markers,
  calendars,
  occurrenceDate,
  occurrenceScope,
  masterId,
  onClose,
}: StopFormProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [icloudDeleteDialogOpen, setICloudDeleteDialogOpen] = useState(false)
  const [icloudDeleting, setICloudDeleting] = useState(false)
  const [icloudSyncError, setICloudSyncError] = useState<string | null>(null)
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(stop?.recurrenceRule ?? null)
  const [targetCalendarId, setTargetCalendarId] = useState<string | null>(
    calendars[0]?.id ?? null
  )

  // True when editing a single occurrence (not master) of a recurring series
  const isOccurrenceEdit = !!occurrenceScope && occurrenceScope !== 'all'

  const seed = stop ?? null
  const defaultStart = seed
    ? new Date(occurrenceDate ?? seed.startDate)
    : icloudSeed
      ? new Date(icloudSeed.startDate)
      : (initialDate ?? new Date())

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      title:    seed?.title    ?? icloudSeed?.title    ?? '',
      notes:    seed?.notes    ?? icloudSeed?.notes    ?? '',
      location: seed?.location ?? icloudSeed?.location ?? '',
      startDate: seed
        ? (seed.allDay
            ? toLocalDateString(new Date(occurrenceDate ?? seed.startDate))
            : toLocalDateTimeString(new Date(occurrenceDate ?? seed.startDate)))
        : icloudSeed
          ? (icloudSeed.allDay
              ? toLocalDateString(new Date(icloudSeed.startDate))
              : toLocalDateTimeString(new Date(icloudSeed.startDate)))
          : toLocalDateTimeString(defaultStart),
      endDate: (() => {
        if (occurrenceDate && seed?.endDate) {
          // Shift end date by the same offset as start
          const offset = new Date(occurrenceDate).getTime() - new Date(seed.startDate).getTime()
          const shifted = new Date(new Date(seed.endDate).getTime() + offset)
          return seed.allDay ? toLocalDateString(shifted) : toLocalDateTimeString(shifted)
        }
        if (seed?.endDate)
          return seed.allDay
            ? toLocalDateString(new Date(seed.endDate))
            : toLocalDateTimeString(new Date(seed.endDate))
        if (icloudSeed?.endDate)
          return icloudSeed.allDay
            ? toLocalDateString(new Date(icloudSeed.endDate))
            : toLocalDateTimeString(new Date(icloudSeed.endDate))
        return ''
      })(),
      allDay:    seed?.allDay ?? icloudSeed?.allDay ?? false,
      markerIds: seed?.markers.map(m => m.markerId) ?? [],
    },
  })

  const allDay            = form.watch('allDay')
  const selectedMarkerIds = form.watch('markerIds')

  function toggleMarker(id: string) {
    const current = form.getValues('markerIds')
    form.setValue(
      'markerIds',
      current.includes(id) ? current.filter(m => m !== id) : [...current, id]
    )
  }

  function parseFormDate(str: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return new Date(str)
  }

  async function onSubmit(values: StopFormValues) {
    await handleSubmit(async () => {
      setICloudSyncError(null)
      const result = await saveStop({
        id:             isOccurrenceEdit ? undefined : stop?.id,
        masterId:       isOccurrenceEdit ? (masterId ?? stop?.id) : undefined,
        occurrenceDate: isOccurrenceEdit ? occurrenceDate ?? undefined : undefined,
        occurrenceScope: occurrenceScope ?? undefined,
        title:     values.title,
        notes:     values.notes || null,
        location:  values.location || null,
        startDate: parseFormDate(values.startDate),
        endDate:   values.endDate ? parseFormDate(values.endDate) : null,
        allDay:    values.allDay,
        markerIds: values.markerIds,
        recurrenceRule: isOccurrenceEdit ? null : recurrenceRule,
        linkedIcloudEventUid:   icloudSeed?.uid        ?? null,
        linkedIcloudEventUrl:   icloudSeed?.url        ?? null,
        linkedIcloudCalendarId: icloudSeed?.calendarId ?? null,
        ...(!stop && !icloudSeed ? { targetCalendarId } : {}),
      })
      router.refresh()
      if (result.icloudError) {
        setICloudSyncError(result.icloudError)
        return
      }
      onClose()
    })
  }

  async function handleDelete() {
    if (!stop) return
    setDeleting(true)

    if (isOccurrenceEdit && occurrenceDate && (masterId ?? stop.id)) {
      // Delete just this occurrence or future occurrences
      await deleteStopOccurrence({
        masterId: masterId ?? stop.id,
        occurrenceDate,
        scope: occurrenceScope!,
      })
    } else {
      await deleteStop(stop.id)
    }
    router.refresh()
    onClose()
  }

  async function handleICloudDelete() {
    if (!icloudSeed) return
    setICloudDeleting(true)
    await deleteICloudEventDirect(icloudSeed.calendarId, icloudSeed.url)
    router.refresh()
    onClose()
  }

  const isEditing   = !!(stop || icloudSeed)
  const isRecurring = !isOccurrenceEdit && !icloudSeed

  const headerTitle = (() => {
    if (occurrenceScope === 'one')    return `Edit this ${terms.stops.slice(0, -1)}`
    if (occurrenceScope === 'future') return `Edit this & following`
    if (stop || icloudSeed)           return `Edit ${terms.stops.slice(0, -1)}`
    return `New ${terms.stops.slice(0, -1)}`
  })()

  return (
    <>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">{headerTitle}</span>
        </div>

        <div className="flex items-center gap-1">
          {stop && (
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
              <TooltipContent>Remove {terms.stops.slice(0, -1).toLowerCase()}</TooltipContent>
            </Tooltip>
          )}
          {icloudSeed && !stop && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive/80"
                  onClick={() => setICloudDeleteDialogOpen(true)}
                  disabled={icloudDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete from iCloud</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="stop-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Add a title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input placeholder="Add a location" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <FormLabel className="mb-0 cursor-pointer">All day</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start</FormLabel>
                  <FormControl>
                    <Input type={allDay ? 'date' : 'datetime-local'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End (optional)</FormLabel>
                  <FormControl>
                    <Input type={allDay ? 'date' : 'datetime-local'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence — only on master stops, not on occurrence edits or iCloud seeds */}
            {isRecurring && (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Repeat
                </FormLabel>
                <RecurrencePicker
                  value={recurrenceRule}
                  startDate={parseFormDate(form.getValues('startDate') || toLocalDateTimeString(new Date()))}
                  onChange={setRecurrenceRule}
                />
              </FormItem>
            )}

            {markers.length > 0 && (
              <FormField
                control={form.control}
                name="markerIds"
                render={() => (
                  <FormItem>
                    <FormLabel>{terms.markers}</FormLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {markers.map(marker => {
                        const selected = selectedMarkerIds.includes(marker.id)
                        return (
                          <button
                            key={marker.id}
                            type="button"
                            onClick={() => toggleMarker(marker.id)}
                            className="text-xs px-2 py-1 rounded-full border transition-all font-medium"
                            style={
                              selected
                                ? { backgroundColor: marker.color, color: contrastColor(marker.color), borderColor: marker.color }
                                : { borderColor: marker.color, color: marker.color }
                            }
                          >
                            {marker.name}
                          </button>
                        )
                      })}
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Calendar sync selector — only for new stops */}
            {!stop && !icloudSeed && calendars.length > 0 && (
              <FormItem>
                <FormLabel>Sync to</FormLabel>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetCalendarId(null)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all font-medium ${
                      targetCalendarId === null
                        ? 'bg-foreground text-background border-foreground'
                        : 'text-muted-foreground border-border hover:border-foreground/50'
                    }`}
                  >
                    None
                  </button>
                  {calendars.map(cal => (
                    <button
                      key={cal.id}
                      type="button"
                      onClick={() => setTargetCalendarId(cal.id)}
                      className="text-xs px-2 py-1 rounded-full border transition-all font-medium"
                      style={
                        targetCalendarId === cal.id
                          ? { backgroundColor: cal.color, color: contrastColor(cal.color), borderColor: cal.color }
                          : { borderColor: cal.color, color: cal.color }
                      }
                    >
                      {cal.name}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add notes..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {icloudSyncError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                Stop saved, but iCloud sync failed: {icloudSyncError}
              </p>
            )}
            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={isEditing ? 'Save Changes' : `Add ${terms.stops.slice(0, -1)}`}
              formId="stop-form"
              onCancel={onClose}
            />
          </form>
        </Form>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.stops.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{stop?.title}&quot;? This cannot be undone.
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

      {/* Delete iCloud event */}
      <AlertDialog open={icloudDeleteDialogOpen} onOpenChange={setICloudDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete iCloud event</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{icloudSeed?.title}&quot; from Apple Calendar? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleICloudDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
