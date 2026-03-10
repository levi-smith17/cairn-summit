'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveFacility } from '@/actions/starfield'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1).max(1, 'Must be a single character'),
  planetId: z.string().min(1, 'Planet is required'),
})

type FormValues = z.infer<typeof schema>

interface FacilityDrawerProps {
  open: boolean
  onClose: () => void
  facility?: any
  systems: any[]
}

export function FacilityDrawer({ open, onClose, facility, systems }: FacilityDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      abbreviation: '',
      planetId: '',
    },
  })

  // Reset with existing values when drawer opens — matches TagDrawer pattern
  useEffect(() => {
    if (open) {
      form.reset({
        name: facility?.name ?? '',
        abbreviation: facility?.abbreviation ?? '',
        planetId: facility?.planetId ?? '',
      })
    }
  }, [open, facility])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveFacility({ id: facility?.id, ...values })
      form.reset()
      onClose()
    })
  }

  const allPlanets = systems
    .flatMap(s => s.planets.map((p: any) => ({
      ...p,
      label: `${p.name} (${s.name})`,
    })))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{facility ? 'Edit Facility' : 'Add Facility'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form id="facility-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Central Manufacturing Hub" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input placeholder="C" maxLength={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="planetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a planet..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allPlanets.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
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
            saveLabel={facility ? 'Save Facility' : 'Add Facility'}
            formId="facility-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}