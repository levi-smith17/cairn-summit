'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveFacility } from '@/actions/starfield'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1).max(1, 'Must be a single character'),
  planetId: z.string().min(1, 'Planet is required'),
})

type FormValues = z.infer<typeof schema>

interface FacilityFormProps {
  facility?: any
  systems: any[]
  onDone: () => void
}

export function FacilityForm({ facility, systems, onDone }: FacilityFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: facility?.name ?? '',
      abbreviation: facility?.abbreviation ?? '',
      planetId: facility?.planetId ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveFacility({ id: facility?.id, ...values })
      onDone()
    })
  }

  const allPlanets = systems
    .flatMap(s => s.planets.map((p: any) => ({ ...p, label: `${p.name} (${s.name})` })))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">{facility ? 'Edit Facility' : 'Add Facility'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="facility-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input placeholder="Central Manufacturing Hub" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="abbreviation" render={({ field }) => (
              <FormItem>
                <FormLabel>Abbreviation</FormLabel>
                <FormControl><Input placeholder="C" maxLength={1} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="planetId" render={({ field }) => (
              <FormItem>
                <FormLabel>Planet</FormLabel>
                <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a planet..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allPlanets.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={facility ? 'Save Changes' : 'Add Facility'}
              formId="facility-form"
              onCancel={onDone}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}
