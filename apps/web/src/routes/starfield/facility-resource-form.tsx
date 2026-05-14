import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertFacilityResource, removeFacilityResource } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  resourceId: z.string().min(1, 'Resource is required'),
  onsite: z.boolean(),
  fromFacilityId: z.string().optional(),
  relayPlanet: z.string().optional(),
  relaySystem: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface FacilityResourceFormProps {
  facilityId: string
  resourceId?: string | null
  resources: any[]
  facilities: any[]
  onDone: () => void
  onRefresh: () => void
}

export function FacilityResourceForm({
  facilityId,
  resourceId,
  resources,
  facilities,
  onDone,
  onRefresh,
}: FacilityResourceFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const isEditing = !!resourceId

  const existingResource = isEditing
    ? resources.find(r => (r.id ?? r.sk?.replace(/^RESOURCE#/, '')) === resourceId)
    : null

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      resourceId: resourceId ?? '',
      onsite: false,
      fromFacilityId: '',
      relayPlanet: '',
      relaySystem: '',
    },
  })

  const watchFromFacilityId = form.watch('fromFacilityId')
  const watchOnsite = form.watch('onsite')

  const resourceOptions = resources.map(r => ({
    value: r.id ?? r.sk?.replace(/^RESOURCE#/, ''),
    label: `[${r.abbreviation}] ${r.name}`,
  }))

  const facilityOptions = facilities
    .filter(f => (f.id ?? f.sk?.replace(/^SF#FACILITY#/, '')) !== facilityId)
    .map(f => ({
      value: f.id ?? f.sk?.replace(/^SF#FACILITY#/, ''),
      label: `[${f.abbreviation}] ${f.name} (${f.planet})`,
    }))

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const relay =
        values.relayPlanet || values.relaySystem
          ? { planet: values.relayPlanet ?? '', system: values.relaySystem ?? '' }
          : null
      await upsertFacilityResource(facilityId, values.resourceId, {
        onsite: values.onsite,
        fromFacilityId: values.fromFacilityId || null,
        relay,
      })
      onRefresh()
      onDone()
    })
  }

  async function handleRemove() {
    if (!resourceId) return
    try {
      await removeFacilityResource(facilityId, resourceId)
      toast.success('Resource removed.')
      onRefresh()
      onDone()
    } catch {
      toast.error('Failed to remove resource.')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <Form {...form}>
        <form id="facility-resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="resourceId" render={({ field }) => (
            <FormItem>
              <FormLabel>Resource</FormLabel>
              <CustomSelect
                options={resourceOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select resource…"
                triggerClassName="w-full"
                disabled={isEditing}
              />
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="onsite" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="onsite" />
              <FormLabel htmlFor="onsite" className="font-normal cursor-pointer">Produced onsite</FormLabel>
            </FormItem>
          )} />

          {!watchOnsite && (
            <FormField control={form.control} name="fromFacilityId" render={({ field }) => (
              <FormItem>
                <FormLabel>Supplied from <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                <CustomSelect
                  options={[{ value: '', label: 'None' }, ...facilityOptions]}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Select facility…"
                  triggerClassName="w-full"
                />
                <FormMessage />
              </FormItem>
            )} />
          )}

          {watchFromFacilityId && !watchOnsite && (
            <div className="space-y-3 rounded-md border border-border/60 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Relay (optional)</p>
              <FormField control={form.control} name="relaySystem" render={({ field }) => (
                <FormItem>
                  <FormLabel>Relay System</FormLabel>
                  <Input placeholder="Sol" {...field} />
                </FormItem>
              )} />
              <FormField control={form.control} name="relayPlanet" render={({ field }) => (
                <FormItem>
                  <FormLabel>Relay Planet</FormLabel>
                  <Input placeholder="Mars" {...field} />
                </FormItem>
              )} />
            </div>
          )}

          <div className="-mx-4 border-t" />

          {isEditing ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={handleRemove}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
              <div className="flex-1" />
              <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" formId="facility-resource-form" onCancel={onDone} />
            </div>
          ) : (
            <FormActions saving={saving} saved={saved} error={error} saveLabel="Add Resource" formId="facility-resource-form" onCancel={onDone} />
          )}
        </form>
      </Form>
    </div>
  )
}
