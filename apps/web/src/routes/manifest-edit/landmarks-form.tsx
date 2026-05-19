import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveLandmark, deleteLandmark } from '@/lib/api/manifest'
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
import { ExternalLink, GitBranch } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { format } from 'date-fns'

const landmarkSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
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
  githubUrl: string | null
  startDate: string | Date | null
  endDate: string | Date | null
  current: boolean
}

interface LandmarksFormProps {
  landmarks: Landmark[]
  adding: boolean
  setAdding: (v: boolean) => void
  saving: boolean
  saved: boolean
  error: boolean
  handleSubmit: (action: () => Promise<void>) => Promise<void>
}

const emptyDefaults: LandmarkFormValues = {
  name: '',
  description: '',
  url: '',
  githubUrl: '',
  startDate: '',
  endDate: '',
  current: false,
}

export function LandmarksForm({ landmarks, adding, setAdding, saving, saved, error, handleSubmit }: LandmarksFormProps) {
  const [editing, setEditing] = useState<string | null>(null)

  const form = useForm<LandmarkFormValues>({
    resolver: zodResolver(landmarkSchema),
    defaultValues: emptyDefaults,
  })

  const current = form.watch('current')

  function startEdit(entry: Landmark) {
    form.reset({
      id: entry.id,
      name: entry.name,
      description: entry.description ?? '',
      url: entry.url ?? '',
      githubUrl: entry.githubUrl ?? '',
      startDate: entry.startDate ? new Date(entry.startDate).toISOString().slice(0, 10) : '',
      endDate: entry.endDate ? new Date(entry.endDate).toISOString().slice(0, 10) : '',
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
    await handleSubmit(async () => {
      await saveLandmark({
        id: values.id,
        name: values.name,
        description: values.description ?? null,
        url: values.url ?? null,
        githubUrl: values.githubUrl ?? null,
        startDate: values.startDate ? new Date(values.startDate) : null,
        endDate: values.current ? null : values.endDate ? new Date(values.endDate) : null,
        current: values.current,
      })
      cancel()
    })
  }

  async function onDelete(id: string) {
    await deleteLandmark(id)
  }

  function renderForm() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-secondary p-4 space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://myproject.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/you/project" {...field} />
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
            <FormActions saving={saving} saved={saved} error={error} saveLabel={editing ? 'Save Changes' : 'Add Landmark'} hideAlert />
          </div>
        </form>
      </Form>
    )
  }

  return (
    <div className="space-y-4">
      {adding && renderForm()}

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
                      {entry.githubUrl && (
                        <a href={entry.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <GitBranch className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {(entry.startDate || entry.endDate) && (
                      <p className="text-sm text-muted-foreground">
                        {entry.startDate ? format(new Date(new Date(entry.startDate).toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy') : ''} —{' '}
                        {entry.current ? 'Present' : entry.endDate ? format(new Date(new Date(entry.endDate).toISOString().slice(0, 10) + 'T12:00:00'), 'MMM yyyy') : ''}
                      </p>
                    )}
                    {entry.description && <RichTextContent html={entry.description} className="text-muted-foreground" />}
                  </div>
                  <EntryActions
                    onEdit={() => startEdit(entry)}
                    onDelete={() => onDelete(entry.id)}
                    deleteTitle="Remove Landmark"
                    itemName={entry.name}
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
