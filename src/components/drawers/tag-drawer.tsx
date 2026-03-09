'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import * as icons from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { saveTag } from '@/actions/waypoints'

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

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().optional(),
})

type TagFormValues = z.infer<typeof tagSchema>

interface TagDrawerProps {
  open: boolean
  onClose: () => void
  tag?: { id: string; name: string; color: string; icon: string | null } | null
}

export function TagDrawer({ open, onClose, tag }: TagDrawerProps) {
  const router = useRouter()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [customColor, setCustomColor] = useState('')

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '', color: PRESET_COLORS[0], icon: '' },
  })

  const watchedName = form.watch('name')
  const watchedColor = form.watch('color')
  const watchedIcon = form.watch('icon')

  useEffect(() => {
    if (open) {
      form.reset({
        name: tag?.name ?? '',
        color: tag?.color ?? PRESET_COLORS[0],
        icon: tag?.icon ?? '',
      })
      setCustomColor(tag?.color ?? '')
    }
  }, [open, tag])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  async function onSubmit(values: TagFormValues) {
    await handleSubmit(async () => {
      await saveTag({ id: tag?.id, name: values.name, color: values.color, icon: values.icon || '' })
      router.refresh()
      form.reset()
      onClose()
    })
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{tag ? 'Edit Tag' : 'New Tag'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form id="tag-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Preview */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <TagBadge tag={{ name: watchedName || 'tag', color: watchedColor, icon: watchedIcon || null }} />
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
            </form>
          </Form>
        </div>

        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={tag ? 'Save Changes' : 'Add Tag'}
            formId="tag-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}