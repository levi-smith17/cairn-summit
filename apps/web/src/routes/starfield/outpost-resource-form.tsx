import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertOutpostResource, removeOutpostResource } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { PlanetPicker } from '@/components/ui/planet-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const schema = z.object({
  resourceId: z.string().min(1, 'Resource is required'),
  onsite: z.boolean(),
  fromOutpostId: z.string().optional(),
  fromPlanet: z.string().optional(),
  fromSystem: z.string().optional(),
  relayPlanet: z.string().optional(),
  relaySystem: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface OutpostResourceFormProps {
  outpostId: string
  resourceId?: string | null
  resources: any[]
  outposts: any[]
  onDone: () => void
  onRefresh: () => void
}

export function OutpostResourceForm({
  outpostId,
  resourceId,
  resources,
  outposts,
  onDone,
  onRefresh,
}: OutpostResourceFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const isEditing = !!resourceId

  // Find the current outpost's existing resource entry for pre-population
  const currentOutpost = outposts.find((o: any) => o.id === outpostId)
  const existingEntry = isEditing
    ? currentOutpost?.resources?.find((r: any) => r.resourceId === resourceId)
    : null

  const existingFromOutpost = existingEntry?.fromOutpostId
    ? outposts.find((o: any) => o.id === existingEntry.fromOutpostId)
    : null

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      resourceId: resourceId ?? '',
      onsite: existingEntry?.onsite ?? false,
      fromOutpostId: existingEntry?.fromOutpostId ?? '',
      fromPlanet: existingFromOutpost?.planet ?? '',
      fromSystem: existingFromOutpost?.system ?? '',
      relayPlanet: existingEntry?.relay?.planet ?? '',
      relaySystem: existingEntry?.relay?.system ?? '',
    },
  })

  const watchFromPlanet = form.watch('fromPlanet')
  const watchOnsite = form.watch('onsite')
  const watchRelayPlanet = form.watch('relayPlanet')

  // Build systems list from all OTHER outposts in the network (for "supplied from" picker)
  const fromSystems = useMemo(() => {
    const systemMap = new Map<string, { id: string; name: string; planets: { id: string; name: string }[] }>()
    for (const o of outposts) {
      if ((o.id ?? o.sk?.replace(/^SF#FACILITY#/, '')) === outpostId) continue
      if (!o.system || !o.planet) continue
      if (!systemMap.has(o.system)) {
        systemMap.set(o.system, { id: o.system, name: o.system, planets: [] })
      }
      const oId = o.id ?? o.sk?.replace(/^SF#FACILITY#/, '')
      const sys = systemMap.get(o.system)!
      if (!sys.planets.find(p => p.name === o.planet)) {
        sys.planets.push({ id: oId, name: o.planet })
      }
    }
    return Array.from(systemMap.values())
  }, [outposts, outpostId])

  // Same systems list for the relay picker (all known planets in network, editable)
  const [relaySystems, setRelaySystems] = useState(() => {
    const systemMap = new Map<string, Set<string>>()
    for (const o of outposts) {
      if (o.system) {
        if (!systemMap.has(o.system)) systemMap.set(o.system, new Set())
        if (o.planet) systemMap.get(o.system)!.add(o.planet)
      }
    }
    return Array.from(systemMap.entries()).map(([name, planets]) => ({
      id: name,
      name,
      planets: Array.from(planets).map(p => ({ id: p, name: p })),
    }))
  })

  const resourceOptions = resources.map((r: any) => ({
    value: r.id ?? r.sk?.replace(/^RESOURCE#/, ''),
    label: `[${r.abbreviation}] ${r.name}`,
  }))

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      // Resolve planet name back to outpost ID
      let resolvedFromOutpostId: string | null = null
      if (values.fromPlanet) {
        const fromOutpost = outposts.find(
          (o: any) => o.planet === values.fromPlanet && o.system === values.fromSystem
        )
        resolvedFromOutpostId = fromOutpost?.id ?? null
      }

      const relay =
        values.relayPlanet || values.relaySystem
          ? { planet: values.relayPlanet ?? '', system: values.relaySystem ?? '' }
          : null

      await upsertOutpostResource(outpostId, values.resourceId, {
        onsite: values.onsite,
        fromOutpostId: resolvedFromOutpostId,
        relay,
      })
      onRefresh()
      onDone()
    })
  }

  async function handleRemove() {
    if (!resourceId) return
    try {
      await removeOutpostResource(outpostId, resourceId)
      toast.success('Resource removed.')
      onRefresh()
      onDone()
    } catch {
      toast.error('Failed to remove resource.')
    }
  }

  const selectedResource = resources.find((r: any) =>
    (r.id ?? r.sk?.replace(/^RESOURCE#/, '')) === resourceId
  )

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium flex-1">
          {isEditing ? 'Edit Resource' : 'Add Resource'}
        </span>
        {isEditing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive/80"
                onClick={() => setRemoveDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove resource</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="outpost-resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
              <FormField control={form.control} name="fromPlanet" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplied from <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <PlanetPicker
                    value={field.value ?? ''}
                    onChange={v => {
                      field.onChange(v)
                      if (!v) {
                        form.setValue('fromSystem', '')
                        form.setValue('fromOutpostId', '')
                      }
                    }}
                    onSystemChange={v => form.setValue('fromSystem', v)}
                    onSelectId={id => form.setValue('fromOutpostId', id)}
                    systems={fromSystems}
                    onSystemsUpdate={() => {}}
                    placeholder="Select outpost…"
                    readonly
                  />
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {watchFromPlanet && !watchOnsite && (
              <div className="space-y-3 rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Relay (optional)</p>
                <FormField control={form.control} name="relayPlanet" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relay Location</FormLabel>
                    <PlanetPicker
                      value={field.value ?? ''}
                      onChange={v => {
                        field.onChange(v)
                        if (!v) form.setValue('relaySystem', '')
                      }}
                      onSystemChange={v => form.setValue('relaySystem', v)}
                      systems={relaySystems}
                      onSystemsUpdate={setRelaySystems}
                      placeholder="Select relay planet…"
                    />
                  </FormItem>
                )} />
              </div>
            )}

            <div className="-mx-4 border-t" />
            <FormActions saving={saving} saved={saved} error={error} saveLabel={isEditing ? 'Save Changes' : 'Add Resource'} formId="outpost-resource-form" onCancel={onDone} />
          </form>
        </Form>
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{selectedResource ? ` "${selectedResource.name}"` : ' this resource'} from this outpost? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
