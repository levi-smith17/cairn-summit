'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveResource } from '@/actions/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CustomSelect } from '@/components/ui/custom-select'
import { ResourcePicker } from '@/components/ui/resource-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1, 'Abbreviation is required'),
  typeId: z.string().min(1, 'Type is required'),
  ingredientIds: z.array(z.string()).max(4).optional(),
})

type FormValues = z.infer<typeof schema>

interface ResourceFormProps {
  resource?: any
  resources: any[]
  resourceTypes: any[]
  onDone: () => void
}

export function ResourceForm({ resource, resources, resourceTypes, onDone }: ResourceFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: resource?.name ?? '',
      abbreviation: resource?.abbreviation ?? '',
      typeId: resource?.typeId ?? '',
      ingredientIds: [
        resource?.resource1Id,
        resource?.resource2Id,
        resource?.resource3Id,
        resource?.resource4Id,
      ].filter(Boolean) as string[],
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const ids = values.ingredientIds ?? []
      await saveResource({
        id: resource?.id,
        name: values.name,
        abbreviation: values.abbreviation,
        typeId: values.typeId,
        resource1Id: ids[0] ?? null,
        resource2Id: ids[1] ?? null,
        resource3Id: ids[2] ?? null,
        resource4Id: ids[3] ?? null,
      })
      onDone()
    })
  }

  // Resources that can be selected as ingredients (exclude self)
  const ingredientOptions = resources.filter(r => r.id !== resource?.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">{resource ? 'Edit Resource' : 'Add Resource'}</span>
      </div>

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

            <FormField control={form.control} name="typeId" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <CustomSelect
                  options={resourceTypes.map(t => ({ value: t.id, label: t.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select type…"
                  triggerClassName="w-full h-9!"
                />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="ingredientIds" render={({ field }) => (
              <FormItem>
                <FormLabel>Ingredients</FormLabel>
                <ResourcePicker
                  value={field.value ?? []}
                  onChange={field.onChange}
                  options={ingredientOptions}
                />
                <FormMessage />
              </FormItem>
            )} />

            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={resource ? 'Save Changes' : 'Add Resource'}
              formId="resource-form"
              onCancel={onDone}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}
