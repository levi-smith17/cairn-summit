'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createMarker, updateMarker, deleteMarker } from '@/lib/api/markers'
import { ChevronRight } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/studio/ui/inspector-form-actions'
import { MarkerBadge } from '@/components/ui/marker-badge'
import { useFormStatus } from '@/hooks/use-form-status'
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
import { extractId } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const PRESET_COLORS = [
  '#ef4444', '#f43f5e', '#f97316', '#fb923c', '#eab308', '#a3e635',
  '#70ca21', '#22c55e', '#16a34a', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#78716c', '#6b7280', '#334155', '#1e293b', '#ffffff',
]

const markerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
})

type MarkerFormValues = z.infer<typeof markerSchema>

interface MarkerItem {
  id: string
  name: string
  color: string
  icon: string | null
}

interface SubmarkerParent {
  name: string
  color: string
  icon: string | null
}

interface MarkerFormProps {
  tag: MarkerItem | null
  /** When set, this is a sub-marker creation: parent path is locked, color/icon pre-filled */
  parentMarker?: SubmarkerParent | null
  onBack: () => void
  onSaved: (id: string) => void
  onDeleted: () => void
}

export function MarkerForm({ tag, parentMarker, onBack, onSaved, onDeleted }: MarkerFormProps) {
  const { terms } = useTerminology()
  const { saving, handleSubmit } = useFormStatus()
  const [customColor, setCustomColor] = useState(tag?.color ?? parentMarker?.color ?? '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const markerSingular = terms.markers.slice(0, -1) || terms.markers

  const form = useForm<MarkerFormValues>({
    resolver: zodResolver(markerSchema),
    defaultValues: {
      name: tag?.name ?? '',
      color: tag?.color ?? parentMarker?.color ?? PRESET_COLORS[6],
    },
  })

  const watchedName = form.watch('name')
  const watchedColor = form.watch('color')

  // For preview: show the full resolved name
  const resolvedName = parentMarker
    ? (watchedName ? `${parentMarker.name}/${watchedName}` : parentMarker.name)
    : watchedName

  async function onSubmit(values: MarkerFormValues) {
    await handleSubmit(async () => {
      const fullName = parentMarker
          ? `${parentMarker.name}/${values.name}`
          : values.name

      if (tag) {
        await updateMarker(tag.id, {
          name: fullName,
          color: values.color,
          icon: tag.icon ?? '',
        })
        await queryClient.invalidateQueries({ queryKey: ['markers', user?.id] })
        onSaved(tag.id)
      } else {
        const result = await createMarker({
          name: fullName,
          color: values.color,
          icon: parentMarker?.icon ?? '',
        })
        await queryClient.invalidateQueries({ queryKey: ['markers', user?.id] })
        onSaved(extractId(result.sk))
      }
      onBack()
    })
  }

  async function handleDelete() {
    if (!tag) return
    try {
      await deleteMarker(tag.id)
      await queryClient.invalidateQueries({ queryKey: ['markers', user?.id] })
      onDeleted()
    } catch {
      toast.error('Failed to delete marker. Please try again.')
    }
  }

  const isSubmarker = !!parentMarker
  const headerTitle = tag
    ? `Edit ${markerSingular}`
    : isSubmarker
      ? `New Sub-${markerSingular}`
      : `New ${markerSingular}`

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorFormHeader title={headerTitle} onBack={onBack} showBack />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Form {...form}>
          <form id="marker-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6 p-4">

              {/* Preview */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <MarkerBadge
                  marker={{
                    name: resolvedName || markerSingular.toLowerCase(),
                    color: watchedColor,
                    icon: tag?.icon ?? parentMarker?.icon ?? null,
                  }}
                />
              </div>

              {/* Parent path — locked, shown only for sub-markers */}
              {isSubmarker && (
                <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-xs">
                  <p className="text-muted-foreground font-medium mb-1">Parent {terms.markers.slice(0, -1).toLowerCase()}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {parentMarker!.name.split('/').map((segment, i, arr) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                        <span className={i === arr.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                          {segment}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isSubmarker ? 'Sub-marker name' : 'Name'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isSubmarker ? `e.g. IAM` : 'e.g. design'}
                        {...field}
                      />
                    </FormControl>
                    {isSubmarker && (
                      <p className="text-[11px] text-muted-foreground">
                        Full name: <span className="font-medium">{resolvedName || '…'}</span>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${field.value === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                            }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        placeholder="#hex"
                        value={customColor}
                        onChange={e => {
                          setCustomColor(e.target.value)
                          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                            field.onChange(e.target.value)
                          }
                        }}
                        className="w-28"
                      />
                      {customColor && /^#[0-9a-fA-F]{6}$/.test(customColor) && (
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: customColor }}
                        />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>

      <InspectorFormActions
        isNew={!tag}
        isSaving={saving}
        formId="marker-form"
        saveLabel="Save changes"
        createLabel={`Add ${markerSingular}`}
        showDelete={!!tag}
        onDelete={() => setDeleteDialogOpen(true)}
        deleteLabel={`Delete ${markerSingular.toLowerCase()}`}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {markerSingular}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{tag?.name}&quot;? All {terms.waypoints.toLowerCase()} and {terms.logs.toLowerCase()} associated with this {markerSingular.toLowerCase()} will be unassigned. This cannot be undone.
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
