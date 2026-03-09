'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveTraining, deleteTraining } from '@/actions/manifest'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { DatePicker } from '@/components/ui/date-picker'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const trainingSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string().optional(),
})

type TrainingFormValues = z.infer<typeof trainingSchema>

interface Training {
  id: string
  institution: string
  degree: string | null
  field: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}

interface TrainingFormProps {
  training: Training[]
}

const emptyDefaults: TrainingFormValues = {
  institution: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

export function TrainingForm({ training }: TrainingFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: emptyDefaults,
  })

  const current = form.watch('current')

  function startAdd() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(true)
  }

  function startEdit(entry: Training) {
    form.reset({
      id: entry.id,
      institution: entry.institution,
      degree: entry.degree ?? '',
      field: entry.field ?? '',
      startDate: entry.startDate.toISOString().split('T')[0],
      endDate: entry.endDate?.toISOString().split('T')[0] ?? '',
      current: entry.current,
      description: entry.description ?? '',
    })
    setAdding(false)
    setEditing(entry.id)
  }

  function cancel() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(false)
  }

  async function onSubmit(values: TrainingFormValues) {
    await handleSubmit(() => saveTraining({
      id: values.id,
      institution: values.institution,
      degree: values.degree ?? null,
      field: values.field ?? null,
      startDate: new Date(values.startDate),
      endDate: values.current ? null : values.endDate ? new Date(values.endDate) : null,
      current: values.current,
      description: values.description ?? null,
    }))
    cancel()
  }

  async function onDelete(id: string) {
    await deleteTraining(id)
  }

  return (
    <div className="space-y-6">
      {/* Existing entries */}
      {training.length > 0 && (
        <div className="space-y-4">
          {training.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{entry.institution}</p>
                  {entry.degree && (
                    <p className="text-sm text-muted-foreground">{entry.degree}</p>
                  )}
                  {entry.field && (
                    <p className="text-sm text-muted-foreground">{entry.field}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {entry.startDate.toLocaleDateString()} —{' '}
                    {entry.current ? 'Present' : entry.endDate?.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(entry)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {entry.description && (
                <RichTextContent html={entry.description} className="text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {(adding || editing) && (
        <>
          {training.length > 0 && <Separator />}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. University of Michigan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Bachelor of Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                        />
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
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select end date"
                          />
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
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>I currently study here</FormLabel>
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
                      <RichTextEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Describe your studies, achievements, activities..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end items-center gap-4">
                <Button type="button" variant="ghost" onClick={cancel}>
                  Cancel
                </Button>
                <FormActions
                  saving={saving}
                  saved={saved}
                  error={error}
                  saveLabel={editing ? 'Update Training' : 'Add Training'}
                />
              </div>
            </form>
          </Form>
        </>
      )}

      {/* Add button */}
      {!adding && !editing && (
        <Button variant="outline" onClick={startAdd}>
          <Plus className="h-4 w-4" />
          Add Training
        </Button>
      )}
    </div>
  )
}