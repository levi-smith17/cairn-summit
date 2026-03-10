'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveResource } from '@/actions/starfield'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

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

interface ResourceDrawerProps {
  open: boolean
  onClose: () => void
  resource?: any
  resources: any[]
  resourceTypes: any[]
}

export function ResourceDrawer({ open, onClose, resource, resources, resourceTypes }: ResourceDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', abbreviation: '', typeId: '', resource1Id: '', resource2Id: '', resource3Id: '', resource4Id: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: resource?.name ?? '',
        abbreviation: resource?.abbreviation ?? '',
        typeId: resource?.typeId ?? '',
        resource1Id: resource?.resource1Id ?? '',
        resource2Id: resource?.resource2Id ?? '',
        resource3Id: resource?.resource3Id ?? '',
        resource4Id: resource?.resource4Id ?? '',
      })
    }
  }, [open, resource])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) { form.reset(); onClose() }
  }

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
      form.reset()
      onClose()
    })
  }

  const ingredientOptions = resources.filter(r => r.id !== resource?.id)

  const ingredientSelect = (name: keyof FormValues, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ingredientOptions.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name} ({r.abbreviation})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  )

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{resource ? 'Edit Resource' : 'Add Resource'}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form id="resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Aluminum" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="abbreviation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation</FormLabel>
                  <FormControl><Input placeholder="Al" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="typeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resourceTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {ingredientSelect('resource1Id', 'Ingredient 1')}
              {ingredientSelect('resource2Id', 'Ingredient 2')}
              {ingredientSelect('resource3Id', 'Ingredient 3')}
              {ingredientSelect('resource4Id', 'Ingredient 4')}
            </form>
          </Form>
        </div>
        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={resource ? 'Save Resource' : 'Add Resource'}
            formId="resource-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
