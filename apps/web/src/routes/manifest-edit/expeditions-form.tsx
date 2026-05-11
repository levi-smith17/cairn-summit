import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveExpedition, deleteExpedition } from '@/lib/api/manifest'
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
import { RichTextContent } from '@/components/ui/rich-text-content'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { format } from 'date-fns'

const expeditionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string().optional(),
})

type ExpeditionFormValues = z.infer<typeof expeditionSchema>

interface Expedition {
  id: string
  title: string
  company: string
  location: string | null
  startDate: Date
  endDate: Date | null
  current: boolean
  description: string | null
}

interface ExpeditionsFormProps {
  expeditions: Expedition[]
  adding: boolean
  setAdding: (v: boolean) => void
  saving: boolean
  saved: boolean
  error: boolean
  handleSubmit: (action: () => Promise<void>) => Promise<void>
}

const emptyDefaults: ExpeditionFormValues = {
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

export function ExpeditionsForm({ expeditions, adding, setAdding, saving, saved, error, handleSubmit }: ExpeditionsFormProps) {
  const [editing, setEditing] = useState<string | null>(null)

  const form = useForm<ExpeditionFormValues>({
    resolver: zodResolver(expeditionSchema),
    defaultValues: emptyDefaults,
  })

  const current = form.watch('current')

  function startEdit(expedition: Expedition) {
    form.reset({
      id: expedition.id,
      title: expedition.title,
      company: expedition.company,
      location: expedition.location ?? '',
      startDate: expedition.startDate.toISOString().split('T')[0],
      endDate: expedition.endDate?.toISOString().split('T')[0] ?? '',
      current: expedition.current,
      description: expedition.description ?? '',
    })
    setAdding(false)
    setEditing(expedition.id)
  }

  function cancel() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(false)
  }

  async function onSubmit(values: ExpeditionFormValues) {
    await handleSubmit(async () => {
      await saveExpedition({
        id: values.id,
        title: values.title,
        company: values.company,
        location: values.location ?? null,
        startDate: new Date(values.startDate),
        endDate: values.current ? null : values.endDate ? new Date(values.endDate) : null,
        current: values.current,
        description: values.description ?? null,
      })
      cancel()
    })
  }

  async function onDelete(id: string) {
    await deleteExpedition(id)
  }

  function renderForm() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-secondary p-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. San Francisco, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>I currently work here</FormLabel>
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
                  <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Describe your role and responsibilities..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end items-center gap-4">
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <FormActions saving={saving} saved={saved} error={error} saveLabel={editing ? 'Save Changes' : 'Add Expedition'} hideAlert />
          </div>
        </form>
      </Form>
    )
  }

  return (
    <div className="space-y-8">
      {adding && renderForm()}

      {expeditions.length > 0 && (
        <div className="relative">
          {expeditions.map((entry) => (
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
                    <p className="font-medium leading-tight">{entry.title}</p>
                    <p className="text-sm text-muted-foreground">{entry.company}</p>
                    {entry.location && <p className="text-sm text-muted-foreground">{entry.location}</p>}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.startDate.toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy')} —{' '}
                      {entry.current ? 'Present' : entry.endDate ? format(new Date(entry.endDate.toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy') : ''}
                    </span>
                    {entry.description && <RichTextContent html={entry.description} className="text-muted-foreground" />}
                  </div>
                  <EntryActions
                    onEdit={() => startEdit(entry)}
                    onDelete={() => onDelete(entry.id)}
                    deleteTitle="Remove Expedition"
                    itemName={entry.title}
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
