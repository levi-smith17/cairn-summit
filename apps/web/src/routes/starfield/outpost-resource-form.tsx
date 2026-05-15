import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertOutpostResource, removeOutpostResource } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { ResourcePicker } from '@/components/ui/resource-picker'
import { PlanetPicker } from '@/components/ui/planet-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Button } from '@/components/ui/button'
import { Trash2, X, CheckCircle2, XCircle } from 'lucide-react'
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
  origin: z.boolean(),
  fromOutpostId: z.string().optional(),
  fromPlanet: z.string().optional(),
  fromSystem: z.string().optional(),
  relayPlanet: z.string().optional(),
  relaySystem: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface SystemEntry {
  id: string
  name: string
  planets: { id: string; name: string }[]
}

interface SystemCrudCallbacks {
  onSystemCreate: (name: string) => void
  onSystemRename: (id: string, newName: string) => void
  onSystemDelete: (id: string) => void
  onPlanetCreate: (systemId: string, name: string) => void
  onPlanetRename: (systemId: string, planetId: string, newName: string) => void
  onPlanetDelete: (systemId: string, planetId: string) => void
}

interface OutpostResourceFormProps {
  outpostId: string
  resourceId?: string | null
  resources: any[]
  outposts: any[]
  systems: SystemEntry[]
  onSystemsUpdate: (systems: SystemEntry[]) => void
  systemCrudCallbacks: SystemCrudCallbacks
  onDone: () => void
  onRefresh: () => void
}

export function OutpostResourceForm({
  outpostId,
  resourceId,
  resources,
  outposts,
  systems,
  onSystemsUpdate,
  systemCrudCallbacks,
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
      origin: existingEntry?.origin ?? false,
      fromOutpostId: existingEntry?.fromOutpostId ?? '',
      fromPlanet: existingFromOutpost?.planet ?? existingEntry?.fromPlanet ?? '',
      fromSystem: existingFromOutpost?.system ?? existingEntry?.fromSystem ?? '',
      relayPlanet: existingEntry?.relay?.planet ?? '',
      relaySystem: existingEntry?.relay?.system ?? '',
    },
  })

  const watchResourceId = form.watch('resourceId')
  const watchFromPlanet = form.watch('fromPlanet')
  const watchOnsite = form.watch('onsite')
  const watchOrigin = form.watch('origin')
  const watchRelayPlanet = form.watch('relayPlanet')

  const ingredientList = useMemo(() => {
    const activeId = watchResourceId || resourceId
    if (!activeId) return []
    const def = resources.find((r: any) => (r.id ?? r.sk?.replace(/^RESOURCE#/, '')) === activeId)
    if (!def?.ingredients?.length) return []

    const resourceDefMap = new Map<string, any>()
    for (const r of resources) {
      resourceDefMap.set(r.id ?? r.sk?.replace(/^RESOURCE#/, ''), r)
    }

    const outpostResourceSet = new Set<string>()
    for (const fr of (currentOutpost?.resources ?? [])) {
      if (fr.onsite || fr.fromOutpostId || fr.fromPlanet || fr.origin) {
        outpostResourceSet.add(fr.resourceId)
      }
    }

    return def.ingredients
      .map((ingredientId: string) => {
        const ingredientDef = resourceDefMap.get(ingredientId)
        return {
          id: ingredientId,
          name: ingredientDef?.name ?? ingredientId,
          abbreviation: ingredientDef?.abbreviation ?? '?',
          satisfied: outpostResourceSet.has(ingredientId),
        }
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }, [watchResourceId, resourceId, resources, currentOutpost])

  // Both pickers use the global systems list from the client

  const pickerOptions = useMemo(() => {
    const assigned = new Set(currentOutpost?.resources?.map((r: any) => r.resourceId) ?? [])
    return resources
      .filter((r: any) => !assigned.has(r.id ?? r.sk?.replace(/^RESOURCE#/, '')))
      .map((r: any) => ({
        id: r.id ?? r.sk?.replace(/^RESOURCE#/, ''),
        name: r.name,
        abbreviation: r.abbreviation,
        typeId: r.type ?? 'Other',
        type: { id: r.type ?? 'Other', name: r.type ?? 'Other' },
      }))
  }, [resources, currentOutpost])

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
        origin: values.origin,
        fromOutpostId: resolvedFromOutpostId,
        fromPlanet: values.fromPlanet || null,
        fromSystem: values.fromSystem || null,
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
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{isEditing ? 'Edit Resource' : 'Add Resource'}</span>
          {currentOutpost && (
            <p className="text-xs text-muted-foreground truncate">
              {currentOutpost.planet} ({currentOutpost.system})
            </p>
          )}
        </div>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}>
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="outpost-resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="resourceId" render={({ field }) => (
              <FormItem>
                <FormLabel>Resource</FormLabel>
                {isEditing ? (
                  <div className="text-sm px-3 py-1.5 bg-muted/30 rounded-md border border-border text-muted-foreground">
                    {selectedResource?.name ?? resourceId}
                  </div>
                ) : (
                  <ResourcePicker
                    value={field.value ? [field.value] : []}
                    onChange={ids => field.onChange(ids[0] ?? '')}
                    options={pickerOptions}
                    maxSelect={1}
                  />
                )}
                <FormMessage />
              </FormItem>
            )} />

            {ingredientList.length > 0 && (
              <div className="space-y-1.5 rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ingredients</p>
                {ingredientList.map((ing: any) => (
                  <div key={ing.id} className="flex items-center gap-2">
                    {ing.satisfied
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    }
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{ing.abbreviation}</span>
                    <span className="text-xs">{ing.name}</span>
                  </div>
                ))}
              </div>
            )}

            <FormField control={form.control} name="onsite" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="onsite" />
                <FormLabel htmlFor="onsite" className="font-normal cursor-pointer">Produced onsite</FormLabel>
              </FormItem>
            )} />

            {!watchOnsite && (
              <FormField control={form.control} name="origin" render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="origin" className="mt-0.5" />
                  <div>
                    <FormLabel htmlFor="origin" className="font-normal cursor-pointer">Supply origin</FormLabel>
                    <p className="text-xs text-muted-foreground">Marks this as the end of the supply chain. Validation stops here.</p>
                  </div>
                </FormItem>
              )} />
            )}

            {!watchOnsite && (
              <FormField control={form.control} name="fromPlanet" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplied from</FormLabel>
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
                    systems={systems}
                    onSystemsUpdate={onSystemsUpdate}
                    placeholder="Select outpost…"
                    {...systemCrudCallbacks}
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
                      systems={systems}
                      onSystemsUpdate={onSystemsUpdate}
                      {...systemCrudCallbacks}
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
