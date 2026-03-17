'use client'

import { useEffect, useState } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveResource } from '@/actions/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Separator } from '@/components/ui/separator'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1, 'Abbreviation is required'),
  typeId: z.string().min(1, 'Type is required'),
  resource1Id: z.string().optional(),
  resource2Id: z.string().optional(),
  resource3Id: z.string().optional(),
  resource4Id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface IngredientAutocompleteProps {
  name: keyof FormValues
  label: string
  options: any[]
  control: any
  listId: string
}

function IngredientAutocomplete({ name, label, options, control, listId }: IngredientAutocompleteProps) {
  const { field } = useController({ name, control })
  const getLabel = (id: string) => {
    const r = options.find(o => o.id === id)
    return r ? `${r.name} (${r.abbreviation})` : ''
  }
  const [inputValue, setInputValue] = useState(() => getLabel(field.value ?? ''))

  useEffect(() => {
    setInputValue(getLabel(field.value ?? ''))
  }, [field.value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value
    setInputValue(text)
    const match = options.find(r => `${r.name} (${r.abbreviation})` === text)
    if (match) field.onChange(match.id)
    else if (text === '') field.onChange('')
  }

  function handleBlur() {
    const match = options.find(r => `${r.name} (${r.abbreviation})` === inputValue)
    if (!match) {
      setInputValue('')
      field.onChange('')
    }
    field.onBlur()
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <input
        list={listId}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="None"
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <datalist id={listId}>
        {options.map(r => (
          <option key={r.id} value={`${r.name} (${r.abbreviation})`} />
        ))}
      </datalist>
    </FormItem>
  )
}

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
      resource1Id: resource?.resource1Id ?? '',
      resource2Id: resource?.resource2Id ?? '',
      resource3Id: resource?.resource3Id ?? '',
      resource4Id: resource?.resource4Id ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveResource({
        id: resource?.id,
        ...values,
        resource1Id: values.resource1Id || null,
        resource2Id: values.resource2Id || null,
        resource3Id: values.resource3Id || null,
        resource4Id: values.resource4Id || null,
      })
      onDone()
    })
  }

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
                <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <IngredientAutocomplete name="resource1Id" label="Ingredient 1" options={ingredientOptions} control={form.control} listId="ing1-list" />
            <IngredientAutocomplete name="resource2Id" label="Ingredient 2" options={ingredientOptions} control={form.control} listId="ing2-list" />
            <IngredientAutocomplete name="resource3Id" label="Ingredient 3" options={ingredientOptions} control={form.control} listId="ing3-list" />
            <IngredientAutocomplete name="resource4Id" label="Ingredient 4" options={ingredientOptions} control={form.control} listId="ing4-list" />

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
