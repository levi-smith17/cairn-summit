'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as icons from 'lucide-react'
import { createMarker, updateMarker, deleteMarker } from '@/lib/api/markers'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { extractId } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#ffffff',
]

const ICON_OPTIONS = [
  // General / UI
  'Tag', 'Star', 'Bookmark', 'Flag', 'Zap', 'Bell', 'Pin',
  'Check', 'AlertTriangle', 'Info', 'HelpCircle', 'Sparkles',
  // People & Social
  'User', 'Users', 'UserCheck', 'Contact', 'MessageCircle', 'Mail', 'Phone',
  // Places & Travel
  'Home', 'Building', 'Building2', 'MapPin', 'Globe', 'Compass', 'Navigation',
  'Plane', 'Car', 'Train', 'Ship', 'Bike',
  // Nature & Outdoors
  'Leaf', 'Trees', 'Flower2', 'Mountain', 'Sun', 'Moon', 'Cloud', 'Umbrella', 'Wind', 'Flame',
  // Food & Drink
  'Coffee', 'Wine', 'UtensilsCrossed', 'ShoppingCart', 'ShoppingBag', 'Apple',
  // Work & Finance
  'Briefcase', 'BarChart2', 'TrendingUp', 'DollarSign', 'CreditCard',
  'Receipt', 'Wallet', 'PiggyBank', 'Landmark',
  // Tech & Media
  'Code', 'Monitor', 'Smartphone', 'Wifi', 'Lock', 'Key', 'Camera', 'Music',
  'Headphones', 'Video', 'Radio', 'Tv',
  // Health & Fitness
  'Heart', 'Activity', 'Stethoscope', 'Dumbbell',
  // Education & Knowledge
  'Book', 'BookOpen', 'GraduationCap', 'Pencil', 'FileText', 'Clipboard',
  // Fun & Hobbies
  'Trophy', 'Gamepad2', 'Palette', 'Scissors',
  // Tools & Organization
  'Wrench', 'Settings', 'Package', 'Box', 'Archive', 'Layers', 'Grid', 'LayoutGrid', 'FolderOpen',
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
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [customColor, setCustomColor] = useState(tag?.color ?? parentMarker?.color ?? '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const form = useForm<MarkerFormValues>({
    resolver: zodResolver(markerSchema),
    defaultValues: {
      name: tag?.name ?? '',
      color: tag?.color ?? parentMarker?.color ?? PRESET_COLORS[0],
      icon: tag?.icon ?? parentMarker?.icon ?? '',
    },
  })

  const watchedName = form.watch('name')
  const watchedColor = form.watch('color')
  const watchedIcon = form.watch('icon')

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
          icon: values.icon || ''
        })
        await queryClient.invalidateQueries({ queryKey: ['markers', user?.id] })
        onSaved(tag.id)
      } else {
        const result = await createMarker({
          name: fullName,
          color: values.color,
          icon: values.icon || ''
        })
        await queryClient.invalidateQueries({ queryKey: ['markers', user?.id] })
        onSaved(extractId(result.sk))
      }
      onBack()
    })
  }

  async function handleDelete() {
    if (!tag) return
    setDeleting(true)
    try {
      await deleteMarker(tag.id)
      await queryClient.invalidateQueries({ queryKey: ['markers', user?.id] })
      onDeleted()
    } catch {
      toast.error('Failed to delete marker. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const isSubmarker = !!parentMarker

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
            {tag
              ? `Edit ${terms.markers.slice(0, -1)}`
              : isSubmarker
                ? `New Sub-${terms.markers.slice(0, -1)}`
                : `New ${terms.markers.slice(0, -1)}`}
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
      <div className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form id="marker-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-4 space-y-6">

              {/* Preview */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <MarkerBadge marker={{ name: resolvedName || terms.markers.slice(0, -1).toLowerCase(), color: watchedColor, icon: watchedIcon || null }} />
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
                            className={`p-1.5 rounded border transition-colors ${field.value === iconName
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
            </div>

            {/* Actions */}
            <div className="p-4 border-t w-full md:w-auto">
              <FormActions
                saving={saving}
                saved={saved}
                error={error}
                saveLabel={tag ? 'Save Changes' : `Add ${terms.markers.slice(0, -1)}`}
                formId="marker-form"
                onCancel={onBack}
              />
            </div>
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
