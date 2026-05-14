import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertFacilityResource } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { PlanetPicker } from '@/components/ui/planet-picker'
import { ResourcePicker } from '@/components/ui/resource-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  resourceId: z.string().min(1, 'Resource is required'),
  planetId: z.string().min(1, 'Planet is required'),
  subfacility1Id: z.string().optional(),
  subfacility2Id: z.string().optional(),
  subfacility3Id: z.string().optional(),
  relayId: z.string().optional(),
  onsite: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface FacilityResourceFormProps {
  facilityResource?: any
  facilities: any[]
  resources: any[]
  systems: any[]
  defaultFacilityId?: string | null
  onDone: () => void
  onRefresh: () => void
}

export function FacilityResourceForm({ facilityResource, facilities, resources, systems: initialSystems, defaultFacilityId, onDone, onRefresh }: FacilityResourceFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [systems, setSystems] = useState(initialSystems)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      facilityId: facilityResource?.facilityId ?? defaultFacilityId ?? '',
      resourceId: facilityResource?.resourceId ?? '',
      planetId: facilityResource?.planetId ?? '',
      subfacility1Id: facilityResource?.subfacility1Id ?? '',
      subfacility2Id: facilityResource?.subfacility2Id ?? '',
      subfacility3Id: facilityResource?.subfacility3Id ?? '',
      relayId: facilityResource?.relayId ?? '',
      onsite: facilityResource?.onsite ?? false,
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await upsertFacilityResource(values.facilityId, values.resourceId, {
        onsite: values.onsite,
      })
      onRefresh()
      onDone()
    })
  }

  const sortedFacilities = [...facilities].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">{facilityResource ? 'Edit Resource' : 'Add Resource'}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="facility-resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="facilityId" render={({ field }) => (
              <FormItem>
                <FormLabel>Facility</FormLabel>
                <CustomSelect options={sortedFacilities.map(f => ({ value: f.id, label: `${f.planet.name} [${f.abbreviation}] ${f.name}` }))} value={field.value} onChange={field.onChange} placeholder="Select facility…" triggerClassName="w-full" />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="resourceId" render={({ field }) => (
              <FormItem>
                <FormLabel>Resource</FormLabel>
                <ResourcePicker options={resources} value={field.value ? [field.value] : []} onChange={ids => field.onChange(ids[0] ?? '')} maxSelect={1} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="planetId" render={({ field }) => (
              <FormItem>
                <FormLabel>Planet</FormLabel>
                <PlanetPicker value={field.value} onChange={field.onChange} systems={systems} onSystemsUpdate={setSystems} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subfacility1Id" render={({ field }) => (
              <FormItem>
                <FormLabel>Subfacility 1 <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                <PlanetPicker value={field.value ?? ''} onChange={field.onChange} systems={systems} onSystemsUpdate={setSystems} placeholder="None" />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subfacility2Id" render={({ field }) => (
              <FormItem>
                <FormLabel>Subfacility 2 <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                <PlanetPicker value={field.value ?? ''} onChange={field.onChange} systems={systems} onSystemsUpdate={setSystems} placeholder="None" />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subfacility3Id" render={({ field }) => (
              <FormItem>
                <FormLabel>Subfacility 3 <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                <PlanetPicker value={field.value ?? ''} onChange={field.onChange} systems={systems} onSystemsUpdate={setSystems} placeholder="None" />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="relayId" render={({ field }) => (
              <FormItem>
                <FormLabel>Relay <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                <PlanetPicker value={field.value ?? ''} onChange={field.onChange} systems={systems} onSystemsUpdate={setSystems} placeholder="None" />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="onsite" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Mined onsite</FormLabel>
              </FormItem>
            )} />
            <div className="-mx-4 border-t" />
            <FormActions saving={saving} saved={saved} error={error} saveLabel={facilityResource ? 'Save Changes' : 'Add Resource'} formId="facility-resource-form" onCancel={onDone} />
          </form>
        </Form>
      </div>
    </div>
  )
}
