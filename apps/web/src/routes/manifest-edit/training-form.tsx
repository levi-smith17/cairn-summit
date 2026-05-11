import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveTraining, deleteTraining } from '@/lib/api/manifest'
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
import { EntryActions } from './entry-actions'
import { FormActions } from '@/components/forms/form-actions'
import { MonthYearPicker } from '@/components/ui/month-year-picker'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { format } from 'date-fns'

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
  adding: boolean
  setAdding: (v: boolean) => void
  saving: boolean
  saved: boolean
  error: boolean
  handleSubmit: (action: () => Promise<void>) => Promise<void>
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

export function TrainingForm({ training, adding, setAdding, saving, saved, error, handleSubmit }: TrainingFormProps) {
  const [editing, setEditing] = useState<string | null>(null)

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: emptyDefaults,
  })

  const current = form.watch('current')

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
    await handleSubmit(async () => {
      await saveTraining({
        id: values.id,
        institution: values.institution,
        degree: values.degree ?? null,
        field: values.field ?? null,
        startDate: new Date(values.startDate),
        endDate: values.current ? null : values.endDate ? new Date(values.endDate) : null,
        current: values.current,
        description: values.description ?? null,
      })
      cancel()
    })
  }

  async function onDelete(id: string) {
    await deleteTraining(id)
  }

  function renderForm() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-secondary p-4 space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Select start date" />
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
                      <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Select end date" />
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
                  <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Describe your studies, achievements, activities..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end items-center gap-4">
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <FormActions saving={saving} saved={saved} error={error} saveLabel={editing ? 'Save Changes' : 'Add Training'} hideAlert />
          </div>
        </form>
      </Form>
    )
  }

  return (
    <div className="space-y-8">
      {adding && renderForm()}

      {training.length > 0 && (
        <div className="relative">
          {training.map((entry) => (
            editing === entry.id ? (
              <div key={entry.id} className="relative pl-6 pb-8 last:pb-0">
                <div className="absolute left-0 top-2 bottom-0 w-px bg-border" />
                <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-foreground ring-2 ring-background" />
                {renderForm()}
              </div>
            ) : (
              <div key={entry.id} className="relative pl-6 pb-8 last:pb-0">
                <div className="absolute left-0 top-2 bottom-0 w-px bg-border" />
                <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-foreground ring-2 ring-background" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium leading-tight">{entry.institution}</p>
                    {entry.degree && <p className="text-sm text-muted-foreground">{entry.degree}</p>}
                    {entry.field && <p className="text-sm text-muted-foreground">{entry.field}</p>}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.startDate.toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy')} —{' '}
                      {entry.current ? 'Present' : entry.endDate ? format(new Date(entry.endDate.toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy') : ''}
                    </span>
                    {entry.description && <RichTextContent html={entry.description} className="text-muted-foreground" />}
                  </div>
                  <EntryActions
                    onEdit={() => startEdit(entry)}
                    onDelete={() => onDelete(entry.id)}
                    deleteTitle="Remove Training"
                    itemName={entry.degree + ' in ' + entry.field}
                  />
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
