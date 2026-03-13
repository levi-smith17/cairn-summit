'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import * as icons from 'lucide-react'
import { ChevronLeft, Tag, Trash2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveMarker, deleteMarker } from '@/actions/waypoints'
import { useTerminology } from '@/contexts/terminology-context'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
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

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#ffffff',
]

const ICON_OPTIONS = [
  'Tag', 'Star', 'Heart', 'Bookmark', 'Flag', 'Zap',
  'Globe', 'Lock', 'Mail', 'Music', 'Camera', 'Code',
  'Coffee', 'Book', 'Briefcase', 'Home', 'Leaf', 'Trophy',
]

const markerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().optional(),
})

type MarkerFormValues = z.infer<typeof markerSchema>

interface MarkerItem {
  id: string
  name: string
  color: string
  icon: string | null
  _count: { waypoints: number }
}

interface MarkerFormProps {
  tag: MarkerItem | null
  onBack: () => void
  onSaved: (id: string) => void
  onDeleted: () => void
}

export function MarkerForm({ tag, onBack, onSaved, onDeleted }: MarkerFormProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [customColor, setCustomColor] = useState(tag?.color ?? '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<MarkerFormValues>({
    resolver: zodResolver(markerSchema),
    defaultValues: {
      name: tag?.name ?? '',
      color: tag?.color ?? PRESET_COLORS[0],
      icon: tag?.icon ?? '',
    },
  })

  const watchedName = form.watch('name')
  const watchedColor = form.watch('color')
  const watchedIcon = form.watch('icon')

  async function onSubmit(values: MarkerFormValues) {
    await handleSubmit(async () => {
      const result = await saveMarker({
        id: tag?.id,
        name: values.name,
        color: values.color,
        icon: values.icon || '',
      })
      router.refresh()
      onSaved(result.id)
      onBack()
    })
  }

  async function handleDelete() {
    if (!tag) return
    setDeleting(true)
    await deleteMarker(tag.id)
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
            {tag ? `Edit ${terms.markers.slice(0, -1)}` : `New ${terms.markers.slice(0, -1)}`}
          </span>
        </div>
        {tag && (
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
              Remove {terms.markers.slice(0, -1).toLowerCase()}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="marker-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Preview */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <MarkerBadge marker={{ name: watchedName || terms.markers.slice(0, -1).toLowerCase(), color: watchedColor, icon: watchedIcon || null }} />
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. design" {...field} />
                  </FormControl>
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
                        className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          field.value === color
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

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon (optional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(iconName => {
                      const Icon = (icons as any)[iconName]
                      if (!Icon) return null
                      return (
                        <button
                          key={iconName}
                          type="button"
                          className={`p-1.5 rounded border transition-colors ${
                            field.value === iconName
                              ? 'border-foreground bg-muted'
                              : 'border-transparent hover:border-muted-foreground'
                          }`}
                          onClick={() => field.onChange(field.value === iconName ? '' : iconName)}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tag && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Applied to {tag._count.waypoints} {tag._count.waypoints !== 1 ? terms.waypoints.toLowerCase() : terms.waypoints.slice(0, -1).toLowerCase()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={tag ? 'Save Changes' : `Add ${terms.markers.slice(0, -1)}`}
              formId="marker-form"
              onCancel={onBack}
            />
          </form>
        </Form>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.markers.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{tag?.name}&quot;? All {terms.waypoints.toLowerCase()} and {terms.logs.toLowerCase()} associated with this {terms.markers.slice(0, -1).toLowerCase()} will be unassigned. This cannot be undone.
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
