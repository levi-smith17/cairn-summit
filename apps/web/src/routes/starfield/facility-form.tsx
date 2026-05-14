import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createFacility, updateFacility } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PlanetPicker } from '@/components/ui/planet-picker'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1).max(6, 'Max 6 characters'),
  system: z.string().min(1, 'System is required'),
  planet: z.string().min(1, 'Planet is required'),
  parentId: z.string().optional(),
  transferStationLimit: z.string(),
})

type FormValues = z.infer<typeof schema>

interface FacilityFormProps {
  facility?: any
  networkId: string
  facilities: any[]
  onDone: () => void
  onRefresh: () => void
}

export function FacilityForm({ facility, networkId, facilities, onDone, onRefresh }: FacilityFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const [systems, setSystems] = useState(() => {
    const systemMap = new Map<string, Set<string>>()
    for (const f of facilities) {
      if (f.system) {
        if (!systemMap.has(f.system)) systemMap.set(f.system, new Set())
        if (f.planet) systemMap.get(f.system)!.add(f.planet)
      }
    }
    return Array.from(systemMap.entries()).map(([name, planets]) => ({
      id: name,
      name,
      planets: Array.from(planets).map(p => ({ id: p, name: p })),
    }))
  })

  const otherFacilities = facilities.filter(
    f => (f.id ?? f.sk?.replace(/^SF#FACILITY#/, '')) !== (facility?.id ?? facility?.sk?.replace(/^SF#FACILITY#/, ''))
  )

  const parentOptions = otherFacilities.map(f => ({
    value: f.id ?? f.sk?.replace(/^SF#FACILITY#/, ''),
    label: `[${f.abbreviation}] ${f.name}`,
  }))

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: facility?.name ?? '',
      abbreviation: facility?.abbreviation ?? '',
      system: facility?.system ?? '',
      planet: facility?.planet ?? '',
      parentId: facility?.parentId ?? '',
      transferStationLimit: String(facility?.transferStationLimit ?? 5),
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const payload = {
        name: values.name,
        abbreviation: values.abbreviation,
        system: values.system,
        planet: values.planet,
        parentId: values.parentId || undefined,
        transferStationLimit: parseInt(values.transferStationLimit, 10) || 5,
      }
      if (facility?.id) {
        await updateFacility(facility.id, payload)
      } else {
        await createFacility({ ...payload, networkId })
      }
      onRefresh()
      onDone()
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">{facility ? 'Edit Facility' : 'Add Facility'}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="facility-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <Input placeholder="Central Manufacturing Hub" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="abbreviation" render={({ field }) => (
              <FormItem>
                <FormLabel>Abbreviation</FormLabel>
                <Input placeholder="CMH" maxLength={6} {...field} />
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="planet" render={({ field }) => (
              <FormItem>
                <FormLabel>Planet</FormLabel>
                <PlanetPicker
                  value={field.value}
                  onChange={v => {
                    field.onChange(v)
                  }}
                  onSystemChange={v => form.setValue('system', v)}
                  systems={systems}
                  onSystemsUpdate={setSystems}
                />
                <FormMessage />
                {form.formState.errors.system && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.system.message}</p>
                )}
              </FormItem>
            )} />

            {parentOptions.length > 0 && (
              <FormField control={form.control} name="parentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Facility <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <CustomSelect
                    options={[{ value: '', label: 'None (root)' }, ...parentOptions]}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="None (root)"
                    triggerClassName="w-full"
                  />
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="transferStationLimit" render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Station Limit</FormLabel>
                <Input type="number" min={0} max={99} {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <div className="-mx-4 border-t" />
            <FormActions saving={saving} saved={saved} error={error} saveLabel={facility ? 'Save Changes' : 'Add Facility'} formId="facility-form" onCancel={onDone} />
          </form>
        </Form>
      </div>
    </div>
  )
}
