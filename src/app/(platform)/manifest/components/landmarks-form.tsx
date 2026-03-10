'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveLandmark, deleteLandmark } from '@/actions/manifest'
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
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { DatePicker } from '@/components/ui/date-picker'
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'

const landmarkSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean(),
})

type LandmarkFormValues = z.infer<typeof landmarkSchema>

interface Landmark {
  id: string
  name: string
  description: string | null
  url: string | null
  startDate: Date | null
  endDate: Date | null
  current: boolean
}

interface LandmarksFormProps {
  landmarks: Landmark[]
}

const emptyDefaults: LandmarkFormValues = {
  name: '',
  description: '',
  url: '',
  startDate: '',
  endDate: '',
  current: false,
}

export function LandmarksForm({ landmarks }: LandmarksFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const form = useForm<LandmarkFormValues>({
    resolver: zodResolver(landmarkSchema),
    defaultValues: emptyDefaults,
  })

  const current = form.watch('current')

  function startAdd() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(true)
  }

  function startEdit(entry: Landmark) {
    form.reset({
      id: entry.id,
      name: entry.name,
      description: entry.description ?? '',
      url: entry.url ?? '',
      startDate: entry.startDate?.toISOString().split('T')[0] ?? '',
      endDate: entry.endDate?.toISOString().split('T')[0] ?? '',
      current: entry.current,
    })
    setAdding(false)
    setEditing(entry.id)
  }

  function cancel() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(false)
  }

  async function onSubmit(values: LandmarkFormValues) {
    await handleSubmit(() => saveLandmark({
      id: values.id,
      name: values.name,
      description: values.description ?? null,
      url: values.url ?? null,
      startDate: values.startDate ? new Date(values.startDate) : null,
      endDate: values.current ? null : values.endDate ? new Date(values.endDate) : null,
      current: values.current,
    }))
    cancel()
  }

  async function onDelete(id: string) {
    await deleteLandmark(id)
  }

  function renderForm() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Cairn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/you/project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!current && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="current"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Currently working on this</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Describe the project, your role, technologies used..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end items-center gap-4">
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <FormActions saving={saving} saved={saved} error={error} saveLabel={editing ? 'Update Landmark' : 'Add Landmark'} />
          </div>
        </form>
      </Form>
    )
  }

  return (
    <div className="space-y-6">
      {landmarks.length > 0 && (
        <div className="space-y-4">
          {landmarks.map((entry) => (
            editing === entry.id ? (
              <div key={entry.id} className="rounded-lg border p-4">
                {renderForm()}
              </div>
            ) : (
              <div key={entry.id} className="rounded-lg border p-4 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.name}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {(entry.startDate || entry.endDate) && (
                      <p className="text-sm text-muted-foreground">
                        {entry.startDate?.toLocaleDateString()} —{' '}
                        {entry.current ? 'Present' : entry.endDate?.toLocaleDateString()}
                      </p>
                    )}
                    {entry.description && <RichTextContent html={entry.description} className="text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {adding && renderForm()}

      {!adding && !editing && (
        <Button variant="outline" onClick={startAdd}>
          <Plus className="h-4 w-4" />
          Add Landmark
        </Button>
      )}
    </div>
  )
}
