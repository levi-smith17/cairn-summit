'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { savePlanet } from '@/actions/starfield'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemId: z.string().min(1, 'System is required'),
})

type FormValues = z.infer<typeof schema>

interface PlanetDrawerProps {
  open: boolean
  onClose: () => void
  planet?: any
  systems: any[]
  defaultSystemId?: string | null
}

export function PlanetDrawer({ open, onClose, planet, systems, defaultSystemId }: PlanetDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', systemId: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: planet?.name ?? '',
        systemId: planet?.systemId ?? defaultSystemId ?? '',
      })
    }
  }, [open, planet, defaultSystemId])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) { form.reset(); onClose() }
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await savePlanet({ id: planet?.id, name: values.name, systemId: values.systemId })
      form.reset()
      onClose()
    })
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{planet ? 'Edit Planet' : 'Add Planet'}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form id="planet-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Muphrid I-a" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a system..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systems.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={planet ? 'Save Planet' : 'Add Planet'}
            formId="planet-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}