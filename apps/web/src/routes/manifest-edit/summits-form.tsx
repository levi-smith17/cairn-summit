import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveSummit, deleteSummit } from '@/lib/api/manifest'
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
import { EntryActions } from './entry-actions'
import { ExternalLink } from 'lucide-react'
import { FormActions } from '@/components/forms/form-actions'
import { MonthYearPicker } from '@/components/ui/month-year-picker'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { format } from 'date-fns'

const summitSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  issuer: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
})

type SummitFormValues = z.infer<typeof summitSchema>

interface Summit {
  id: string
  title: string
  issuer: string | null
  date: string | Date | null
  description: string | null
  url: string | null
}

interface SummitsFormProps {
  summits: Summit[]
  adding: boolean
  setAdding: (v: boolean) => void
  saving: boolean
  saved: boolean
  error: boolean
  handleSubmit: (action: () => Promise<void>) => Promise<void>
}

const emptyDefaults: SummitFormValues = {
  title: '',
  issuer: '',
  date: '',
  description: '',
  url: '',
}

export function SummitsForm({ summits, adding, setAdding, saving, saved, error, handleSubmit }: SummitsFormProps) {
  const [editing, setEditing] = useState<string | null>(null)

  const form = useForm<SummitFormValues>({
    resolver: zodResolver(summitSchema),
    defaultValues: emptyDefaults,
  })

  function startEdit(entry: Summit) {
    form.reset({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer ?? '',
      date: entry.date ? new Date(entry.date).toISOString().slice(0, 10) : '',
      description: entry.description ?? '',
      url: entry.url ?? '',
    })
    setAdding(false)
    setEditing(entry.id)
  }

  function cancel() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(false)
  }

  async function onSubmit(values: SummitFormValues) {
    await handleSubmit(async () => {
      await saveSummit({
        id: values.id,
        title: values.title,
        issuer: values.issuer ?? null,
        date: values.date ? new Date(values.date) : null,
        description: values.description ?? null,
        url: values.url ?? null,
      })
      cancel()
    })
  }

  async function onDelete(id: string) {
    await deleteSummit(id)
  }

  function renderForm() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-secondary p-4 space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Employee of the Year" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issuer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuer</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Select date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://credential-url.com" {...field} />
                </FormControl>
                <FormMessage />
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
                  <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Describe the achievement..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end items-center gap-4">
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <FormActions saving={saving} saved={saved} error={error} saveLabel={editing ? 'Save Changes' : 'Add Summit'} hideAlert />
          </div>
        </form>
      </Form>
    )
  }

  return (
    <div className="space-y-6">
      {adding && renderForm()}

      {summits.length > 0 && (
        <div className="space-y-4">
          {summits.map((entry) => (
            editing === entry.id ? (
              <div key={entry.id} className="rounded-lg border p-4">
                {renderForm()}
              </div>
            ) : (
              <div key={entry.id} className="rounded-lg border p-4 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.title}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {entry.issuer && <p className="text-sm text-muted-foreground">{entry.issuer}</p>}
                    {entry.date && <p className="text-sm text-muted-foreground">{format(new Date(new Date(entry.date).toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy')}</p>}
                    {entry.description && <RichTextContent html={entry.description} className="text-muted-foreground" />}
                  </div>
                  <EntryActions
                    onEdit={() => startEdit(entry)}
                    onDelete={() => onDelete(entry.id)}
                    deleteTitle="Remove Summit"
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
