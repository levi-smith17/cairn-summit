import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { SF_CONTROL } from './constants'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1, 'Abbreviation is required'),
})

type FormValues = z.infer<typeof schema>

interface NetworkFormProps {
  network?: { id: string; name: string; abbreviation: string }
  onSave: (name: string, abbreviation: string) => Promise<void>
  onCancel: () => void
}

export function NetworkForm({ network, onSave, onCancel }: NetworkFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const formId = 'network-form'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: network?.name ?? '',
      abbreviation: network?.abbreviation ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await onSave(values.name.trim(), values.abbreviation.trim())
    })
  }

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Network name</FormLabel>
            <Input className={SF_CONTROL} {...field} />
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="abbreviation" render={({ field }) => (
          <FormItem>
            <FormLabel>Abbreviation</FormLabel>
            <Input className={SF_CONTROL} {...field} />
            <FormMessage />
          </FormItem>
        )} />
        <FormActions
          saving={saving}
          saved={saved}
          error={error}
          saveLabel={network ? 'Save Changes' : 'Create Network'}
          formId={formId}
          onCancel={onCancel}
          buttonClassName={SF_CONTROL}
        />
      </form>
    </Form>
  )
}
