'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveWaypoint } from '@/actions/waypoints'

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
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [fetching, setFetching] = useState(false)
  const [favicon, setFavicon] = useState<string | null>(waypoint?.favicon ?? null)

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
      onClose()
    })
  }

  function toggleTag(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue(
      'tagIds',
      current.includes(tagId)
        ? current.filter(id => id !== tagId)
        : [...current, tagId]
    )
  }

  const selectedTagIds = form.watch('tagIds')

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

              {/* Folder */}
              <FormField
                control={form.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
                    <Select
                      onValueChange={val => field.onChange(val === 'none' ? '' : val)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No folder</SelectItem>
                        {folders.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              {tags.length > 0 && (
                <FormField
                  control={form.control}
                  name="tagIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`rounded-full transition-opacity ${selectedTagIds.includes(tag.id)
                                ? 'opacity-100 ring-2 ring-offset-1'
                                : 'opacity-50'
                              }`}
                            style={{
                              ['--tw-ring-color' as any]: tag.color,
                            }}
                          >
                            <TagBadge tag={tag} />
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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