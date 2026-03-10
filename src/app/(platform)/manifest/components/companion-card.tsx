'use client'

import { useState, } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  saveCompanion,
  deleteCompanion,
  deleteCompanionMedia,
  updateCompanionMediaCaption,
} from '@/actions/manifest'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Trash2, Pencil, X, ImagePlus } from 'lucide-react'
import { formatAge } from '@/lib/format-age'

const companionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  birthday: z.string().optional(),
  bio: z.string().optional(),
  passed: z.boolean().default(false),
})

type CompanionFormValues = z.infer<typeof companionSchema>

interface CompanionMedia {
  id: string
  key: string
  type: 'IMAGE' | 'VIDEO'
  caption?: string | null
  order: number
}

interface Companion {
  id: string
  name: string
  species: string
  breed?: string | null
  birthday?: Date | null
  bio?: string | null
  passed?: boolean
  media: CompanionMedia[]
}

interface CompanionCardProps {
  companion: Companion
  onRefresh: () => void
}

export function CompanionCard({ companion, onRefresh }: CompanionCardProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const media = companion.media ?? []

  const form = useForm({
    resolver: zodResolver(companionSchema),
    defaultValues: {
      name: companion.name,
      species: companion.species,
      breed: companion.breed ?? '',
      birthday: companion.birthday
        ? new Date(companion.birthday).toISOString().split('T')[0]
        : '',
      bio: companion.bio ?? '',
      passed: !!companion.passed,
    },
  })

  async function onSubmit(values: CompanionFormValues) {
    await handleSubmit(async () => {
      await saveCompanion({
        id: companion.id,
        name: values.name,
        species: values.species,
        breed: values.breed || null,
        birthday: values.birthday ? new Date(values.birthday) : null,
        bio: values.bio || null,
        passed: values.passed,
      })
      setEditing(false)
    })
  }

  async function handleDelete() {
    await deleteCompanion(companion.id)
    onRefresh()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companionId', companion.id)
      formData.append('order', String(media.length))

      const res = await fetch('/api/companions/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.key) {
        onRefresh()
      }
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    await deleteCompanionMedia(mediaId)
    onRefresh()
  }

  const mediaFilename = (key: string) => key.split('/').pop()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {companion.name}
            {companion.passed && (
              <span className="text-xs font-normal text-muted-foreground italic"> [Summit Reached]</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(!editing)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Companion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove "{companion.name}"? All photos and videos will be permanently deleted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {companion.species}
          {companion.breed ? ` · ${companion.breed}` : ''}
          {companion.birthday && !companion.passed ? ` · ${formatAge(new Date(companion.birthday))}` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species</FormLabel>
                      <FormControl><Input placeholder="Dog, Cat..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed (optional)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Summit reached (passed away)?</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (optional)</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Tell their story..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormActions
                saving={saving}
                saved={saved}
                error={error}
                saveLabel="Save Companion"
              />
            </form>
          </Form>
        )}

        {/* Media Grid */}
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                  {m.type === 'IMAGE' ? (
                    <img
                      src={`/api/companions/media/${mediaFilename(m.key)}`}
                      alt={m.caption ?? companion.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={`/api/companions/media/${mediaFilename(m.key)}`}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover:flex">
                        <X className="h-3 w-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {m.type === 'VIDEO' ? 'Video' : 'Photo'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this {m.type === 'VIDEO' ? 'video' : 'photo'}? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMedia(m.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <input
                  type="text"
                  defaultValue={m.caption ?? ''}
                  placeholder="Add caption..."
                  className="w-full text-xs px-2 py-1 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  onBlur={async (e) => {
                    const caption = e.target.value.trim() || null
                    if (caption !== m.caption) {
                      await updateCompanionMediaCaption(m.id, caption)
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Upload */}
        <div>
          <label
            htmlFor={`companion-upload-${companion.id}`}
            className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Add Photo / Video'}
          </label>
          <input
            id={`companion-upload-${companion.id}`}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}