'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveSummit, deleteSummit } from '@/actions/manifest'
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
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { DatePicker } from '@/components/ui/date-picker'
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Separator } from '@/components/ui/separator'

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
  date: Date | null
  description: string | null
  url: string | null
}

interface SummitsFormProps {
  summits: Summit[]
}

const emptyDefaults: SummitFormValues = {
  title: '',
  issuer: '',
  date: '',
  description: '',
  url: '',
}

export function SummitsForm({ summits }: SummitsFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const form = useForm<SummitFormValues>({
    resolver: zodResolver(summitSchema),
    defaultValues: emptyDefaults,
  })

  function startAdd() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(true)
  }

  function startEdit(entry: Summit) {
    form.reset({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer ?? '',
      date: entry.date?.toISOString().split('T')[0] ?? '',
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
    await handleSubmit(() => saveSummit({
      id: values.id,
      title: values.title,
      issuer: values.issuer ?? null,
      date: values.date ? new Date(values.date) : null,
      description: values.description ?? null,
      url: values.url ?? null,
    }))
    cancel()
  }

  async function onDelete(id: string) {
    await deleteSummit(id)
  }

  return (
    <div className="space-y-6">
      {/* Existing entries */}
      {summits.length > 0 && (
        <div className="space-y-4">
          {summits.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{entry.title}</p>
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {entry.issuer && (
                    <p className="text-sm text-muted-foreground">{entry.issuer}</p>
                  )}
                  {entry.date && (
                    <p className="text-sm text-muted-foreground">
                      {entry.date.toLocaleDateString()}
                    </p>
                  )}
                  {entry.description && (
                    <RichTextContent html={entry.description} className="text-muted-foreground" />
                  )}
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
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {(adding || editing) && (
        <>
          {summits.length > 0 && <Separator />}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="grid grid-cols-2 gap-4">
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
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select date"
                        />
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
                      <RichTextEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Describe the achievement..."
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
                  saveLabel={editing ? 'Update Summit' : 'Add Summit'}
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
          Add Summit
        </Button>
      )}
    </div>
  )
}