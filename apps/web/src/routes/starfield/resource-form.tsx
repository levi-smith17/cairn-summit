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
import { SF_CONTROL } from './constants'
import { Cuboid, Droplet, Wind, Component } from 'lucide-react'

const RESOURCE_TYPE_OPTIONS = [
  { value: 'Gas', label: 'Gas', icon: Wind },
  { value: 'Liquid', label: 'Liquid', icon: Droplet },
  { value: 'Manufactured', label: 'Manufactured', icon: Component },
  { value: 'Solid', label: 'Solid', icon: Cuboid },
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
    const others = resources.filter(r => r.id !== resource?.id)
    const nameTaken = others.find(r => r.name.toLowerCase() === values.name.toLowerCase())
    if (nameTaken) {
      form.setError('name', { message: 'A resource with this name already exists' })
      return
    }
    const abbrevTaken = others.find(r => r.abbreviation.toLowerCase() === values.abbreviation.toLowerCase())
    if (abbrevTaken) {
      form.setError('abbreviation', { message: 'A resource with this abbreviation already exists' })
      return
    }
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
              <Input placeholder="Aluminum" className={SF_CONTROL} {...field} />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="abbreviation" render={({ field }) => (
            <FormItem>
              <FormLabel>Abbreviation</FormLabel>
              <Input placeholder="Al" className={SF_CONTROL} {...field} />
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
          <FormActions saving={saving} saved={saved} error={error} saveLabel={resource ? 'Save Changes' : 'Add Resource'} formId="resource-form" onCancel={onDone} buttonClassName={SF_CONTROL} />
        </form>
      </Form>
    </div>
  )
}
