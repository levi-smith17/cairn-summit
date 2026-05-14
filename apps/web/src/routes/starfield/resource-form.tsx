import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveResource } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CustomSelect } from '@/components/ui/custom-select'
import { ResourcePicker } from '@/components/ui/resource-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const RESOURCE_TYPE_OPTIONS = [
  { value: 'Gas', label: 'Gas' },
  { value: 'Solid', label: 'Solid' },
  { value: 'Liquid', label: 'Liquid' },
  { value: 'Manufactured', label: 'Manufactured' },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1, 'Abbreviation is required'),
  type: z.string().min(1, 'Type is required'),
  ingredients: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'Manufactured' && (!data.ingredients || data.ingredients.length < 2)) {
    ctx.addIssue({ code: 'custom', message: 'Manufactured resources require at least 2 ingredients', path: ['ingredients'] })
  }
})

type FormValues = z.infer<typeof schema>

interface ResourceFormProps {
  resource?: any
  resources: any[]
  onDone: () => void
  onRefresh: () => void
}

export function ResourceForm({ resource, resources, onDone, onRefresh }: ResourceFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: resource?.name ?? '',
      abbreviation: resource?.abbreviation ?? '',
      type: resource?.type ?? '',
      ingredients: resource?.ingredients ?? [],
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveResource({
        id: resource?.id,
        name: values.name,
        abbreviation: values.abbreviation,
        type: values.type,
        ingredients: values.ingredients ?? [],
      })
      onRefresh()
      onDone()
    })
  }

  const watchType = form.watch('type')
  const ingredientOptions = resources.filter(r => (r.id ?? r.sk) !== (resource?.id ?? resource?.sk))

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <Form {...form}>
        <form id="resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input placeholder="Aluminum" {...field} />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="abbreviation" render={({ field }) => (
            <FormItem>
              <FormLabel>Abbreviation</FormLabel>
              <Input placeholder="Al" {...field} />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <CustomSelect
                options={RESOURCE_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select type…"
                triggerClassName="w-full"
              />
              <FormMessage />
            </FormItem>
          )} />
          {watchType === 'Manufactured' && (
            <FormField control={form.control} name="ingredients" render={({ field }) => (
              <FormItem>
                <FormLabel>Ingredients <span className="text-muted-foreground text-xs font-normal">(min. 2)</span></FormLabel>
                <ResourcePicker value={field.value ?? []} onChange={field.onChange} options={ingredientOptions} />
                <FormMessage />
              </FormItem>
            )} />
          )}
          <div className="-mx-4 border-t" />
          <FormActions saving={saving} saved={saved} error={error} saveLabel={resource ? 'Save Changes' : 'Add Resource'} formId="resource-form" onCancel={onDone} />
        </form>
      </Form>
    </div>
  )
}
