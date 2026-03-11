'use client'

import { useState, useEffect } from 'react'
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
import { saveWaypoint, createFolder, createTag } from '@/actions/waypoints'

const TAG_COLORS = [
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
      setCreatingFolder(false)
      setNewFolderName('')
      setCreatingTag(false)
      setNewTagName('')
      setNewTagColor(TAG_COLORS[4])
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

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    setFolderCreating(true)
    try {
      const folder = await createFolder(name)
      setLocalFolders(prev => [...prev, folder])
      form.setValue('folderId', folder.id)
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
