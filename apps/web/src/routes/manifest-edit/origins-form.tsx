import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveOrigins } from '@/lib/api/manifest'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useFormStatus } from '@/hooks/use-form-status'

const originsSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
})

type OriginsFormValues = z.infer<typeof originsSchema>

interface OriginsFormProps {
  defaultValues?: Partial<OriginsFormValues>
  onSaved?: () => void
}

export function OriginsForm({ defaultValues, onSaved }: OriginsFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<OriginsFormValues>({
    resolver: zodResolver(originsSchema),
    defaultValues: defaultValues ?? {
      headline: '',
      summary: '',
      bio: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
  })

  async function onSubmit(values: OriginsFormValues) {
    await handleSubmit(async () => {
      await saveOrigins({
        headline: values.headline ?? null,
        summary: values.summary ?? null,
        bio: values.bio ?? null,
        location: values.location ?? null,
        website: values.website ?? null,
        linkedin: values.linkedin ?? null,
        github: values.github ?? null,
      })
      onSaved?.()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headline</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Full Stack Developer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="A brief summary about yourself..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trail Notes (Bio)</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Tell your story..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://yourwebsite.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkedin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="github"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/yourusername" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormActions
          saving={saving}
          saved={saved}
          error={error}
          saveLabel="Save Changes"
        />
      </form>
    </Form>
  )
}
