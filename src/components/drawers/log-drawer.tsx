'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveLog } from '@/actions/logs'

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
  const { saving, saved, error, handleSubmit } = useFormStatus()

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

  // Reset form when log changes
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
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
  const selectedFolderId = form.watch('folderId')
  const selectedWaypointId = form.watch('waypointId')

  // Filter waypoints to selected folder if one is chosen
  const filteredWaypoints = selectedFolderId && selectedFolderId !== 'none'
    ? waypoints.filter(w => w.folderId === selectedFolderId)
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
      <DrawerContent className="h-full w-96 flex flex-col">
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

              {/* Folder */}
              <FormField
                control={form.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
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
                    <FormDescription>
                      {selectedWaypointId && selectedWaypointId !== 'none'
                        ? 'Folder is set by the selected waypoint.'
                        : 'Choosing a folder filters the waypoints below.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Waypoint — filtered by folder */}
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