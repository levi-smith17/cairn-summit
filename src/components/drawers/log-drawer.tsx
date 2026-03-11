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
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveLog } from '@/actions/logs'
import { createFolder, createTag } from '@/actions/waypoints'

const TAG_COLORS = [
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
  const { saving, saved, error, handleSubmit } = useFormStatus()

  // Local copies so inline creation updates are visible immediately
  const [localFolders, setLocalFolders] = useState(folders)
  const [localTags, setLocalTags] = useState(tags)
  useEffect(() => { setLocalFolders(folders) }, [folders])
  useEffect(() => { setLocalTags(tags) }, [tags])

  // Inline folder creation
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderCreating, setFolderCreating] = useState(false)

  // Inline tag creation
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[4])
  const [tagCreating, setTagCreating] = useState(false)

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
      setCreatingFolder(false)
      setNewFolderName('')
      setCreatingTag(false)
      setNewTagName('')
      setNewTagColor(TAG_COLORS[4])
      onClose()
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    setFolderCreating(true)
    try {
      const folder = await createFolder(name)
      setLocalFolders(prev => [...prev, folder])
      form.setValue('folderId', folder.id)
      form.setValue('waypointId', '')
      setCreatingFolder(false)
      setNewFolderName('')
    } finally {
      setFolderCreating(false)
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim()
    if (!name) return
    setTagCreating(true)
    try {
      const tag = await createTag({ name, color: newTagColor })
      setLocalTags(prev => [...prev, tag])
      const current = form.getValues('tagIds')
      form.setValue('tagIds', [...current, tag.id])
      setCreatingTag(false)
      setNewTagName('')
      setNewTagColor(TAG_COLORS[4])
    } finally {
      setTagCreating(false)
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

              {/* Folder */}
              <FormField
                control={form.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Folder</FormLabel>
                      {!creatingFolder && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs px-2"
                          onClick={() => setCreatingFolder(true)}
                        >
                          <Plus className="h-3 w-3" />
                          New folder
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
                          <SelectValue placeholder="No folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No folder</SelectItem>
                        {localFolders.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {creatingFolder && (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreateFolder() }
                            if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={handleCreateFolder}
                          disabled={!newFolderName.trim() || folderCreating}
                        >
                          {folderCreating
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Check className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => { setCreatingFolder(false); setNewFolderName('') }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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
              <FormField
                control={form.control}
                name="tagIds"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Tags</FormLabel>
                      {!creatingTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs px-2"
                          onClick={() => setCreatingTag(true)}
                        >
                          <Plus className="h-3 w-3" />
                          New tag
                        </Button>
                      )}
                    </div>
                    {localTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {localTags.map(tag => (
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
                    )}
                    {creatingTag && (
                      <div className="flex flex-col gap-2 p-2 border rounded-md">
                        <Input
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          placeholder="Tag name"
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Escape') { setCreatingTag(false); setNewTagName('') }
                          }}
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {TAG_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              className={`h-5 w-5 rounded-full ring-offset-1 transition-all ${newTagColor === color ? 'ring-2 scale-110' : ''}`}
                              style={{ backgroundColor: color, ['--tw-ring-color' as any]: color }}
                              onClick={() => setNewTagColor(color)}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim() || tagCreating}
                          >
                            {tagCreating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Add tag
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setCreatingTag(false); setNewTagName(''); setNewTagColor(TAG_COLORS[4]) }}
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
