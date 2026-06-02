import { useState, useMemo, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertOutpostResource, removeOutpostResource } from '@/lib/api/starfield'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { ResourcePicker } from '@/components/ui/resource-picker'
import { PlanetPicker } from '@/components/ui/planet-picker'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Button } from '@/components/ui/button'
import { Trash2, X, CheckCircle2, XCircle, Plus } from 'lucide-react'
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
import {
  getEnrichedSupplyLines,
  getSupplyLines,
  normalizeOutpostResource,
  resolveSourceOutpostId,
  type OutpostWithId,
} from '@/lib/starfield-utils'
import { SF_CONTROL, SF_ICON_CONTROL } from './constants'

const supplySchema = z.object({
  fromPlanet: z.string().optional(),
  fromSystem: z.string().optional(),
  relayPlanet: z.string().optional(),
  relaySystem: z.string().optional(),
})

const schema = z.object({
  resourceId: z.string().min(1, 'Resource is required'),
  onsite: z.boolean(),
  origin: z.boolean(),
  supplies: z.array(supplySchema),
}).superRefine((data, ctx) => {
  if (data.onsite) return
  if (!data.origin && data.supplies.length < 1) {
    ctx.addIssue({ code: 'custom', message: 'At least one supply source is required', path: ['supplies'] })
  }
  const requireFromPlanet = !data.origin
  data.supplies.forEach((s, i) => {
    const hasLine =
      !!s.fromPlanet?.trim() ||
      !!s.fromSystem?.trim() ||
      !!s.relayPlanet?.trim() ||
      !!s.relaySystem?.trim()
    if (requireFromPlanet || hasLine) {
      if (!s.fromPlanet?.trim()) {
        ctx.addIssue({ code: 'custom', message: 'Supplied from is required', path: ['supplies', i, 'fromPlanet'] })
      }
    }
  })
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
  systemCrudCallbacks: SystemCrudCallbacks
  onDone: () => void
  onRefresh: () => void
}

function suppliesFromEntry(
  entry: ReturnType<typeof normalizeOutpostResource> | null,
  outposts: OutpostWithId[]
) {
  const lines = entry ? getEnrichedSupplyLines(entry, outposts) : []
  if (lines.length === 0) {
    return [{ fromPlanet: '', fromSystem: '', relayPlanet: '', relaySystem: '' }]
  }
  return lines.map(s => ({
    fromPlanet: s.fromPlanet ?? '',
    fromSystem: s.fromSystem ?? '',
    relayPlanet: s.relay?.planet ?? '',
    relaySystem: s.relay?.system ?? '',
  }))
}

export function OutpostResourceForm({
  outpostId,
  resourceId,
  resources,
  outposts,
  systems,
  systemCrudCallbacks,
  onDone,
  onRefresh,
}: OutpostResourceFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const isEditing = !!resourceId

  const outpostsWithId = outposts as OutpostWithId[]
  const currentOutpost = outpostsWithId.find(o => o.id === outpostId)
  const rawEntry = isEditing
    ? currentOutpost?.resources?.find(r => r.resourceId === resourceId)
    : null
  const existingEntry = rawEntry ? normalizeOutpostResource(rawEntry) : null
  const initialSupplies = suppliesFromEntry(existingEntry, outpostsWithId)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      resourceId: resourceId ?? '',
      onsite: existingEntry?.onsite ?? false,
      origin: existingEntry?.origin ?? false,
      supplies: initialSupplies,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'supplies',
  })

  const formSeed = useMemo(() => {
    if (!isEditing || !rawEntry) return ''
    const entry = normalizeOutpostResource(rawEntry)
    return JSON.stringify({
      onsite: entry.onsite,
      origin: entry.origin ?? false,
      supplies: suppliesFromEntry(entry, outpostsWithId),
    })
  }, [isEditing, rawEntry, outpostsWithId])

  const lastFormSeed = useRef('')
  useEffect(() => {
    if (!formSeed || formSeed === lastFormSeed.current) return
    lastFormSeed.current = formSeed
    const parsed = JSON.parse(formSeed) as Pick<FormValues, 'onsite' | 'origin' | 'supplies'>
    form.reset({
      resourceId: resourceId ?? '',
      ...parsed,
    })
  }, [formSeed, resourceId, form])

  const watchResourceId = form.watch('resourceId')
  const watchOnsite = form.watch('onsite')
  const watchSupplies = form.watch('supplies')

  const ingredientList = useMemo(() => {
    const activeId = watchResourceId || resourceId
    if (!activeId) return []
    const def = resources.find((r: any) => (r.id ?? r.sk?.replace(/^RESOURCE#/, '')) === activeId)
    if (!def?.ingredients?.length) return []

    const counts = new Map<string, number>()
    for (const fr of (currentOutpost?.resources ?? []).map(normalizeOutpostResource)) {
      if (fr.resourceId === activeId) continue
      if (fr.onsite || fr.origin) {
        counts.set(fr.resourceId, (counts.get(fr.resourceId) ?? 0) + 1)
        continue
      }
      const validLines = getEnrichedSupplyLines(fr, outpostsWithId).filter(
        s => resolveSourceOutpostId(s, outpostsWithId) != null
      )
      if (validLines.length > 0) {
        counts.set(fr.resourceId, (counts.get(fr.resourceId) ?? 0) + validLines.length)
      }
    }

    if (!isEditing && watchOnsite) {
      counts.set(activeId, (counts.get(activeId) ?? 0) + 1)
    } else if (!watchOnsite) {
      const draftValid = (watchSupplies ?? []).filter(s => {
        if (!s.fromPlanet?.trim()) return false
        return resolveSourceOutpostId(
          { fromPlanet: s.fromPlanet, fromSystem: s.fromSystem ?? null },
          outpostsWithId
        ) != null
      }).length
      if (draftValid > 0) {
        counts.set(activeId, (counts.get(activeId) ?? 0) + draftValid)
      }
    }

    return def.ingredients
      .map((ingredientId: string) => {
        const ingredientDef = resources.find(
          (r: any) => (r.id ?? r.sk?.replace(/^RESOURCE#/, '')) === ingredientId
        )
        const have = counts.get(ingredientId) ?? 0
        return {
          id: ingredientId,
          name: ingredientDef?.name ?? ingredientId,
          abbreviation: ingredientDef?.abbreviation ?? '?',
          satisfied: have > 0,
          count: have,
        }
      })
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
  }, [watchResourceId, resourceId, resources, currentOutpost, watchOnsite, watchSupplies, isEditing, outpostsWithId])

  const pickerOptions = useMemo(() => {
    const assigned = new Set(currentOutpost?.resources?.map(r => r.resourceId) ?? [])
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

  const planetPickerProps = {
    systems,
    allowManageSystems: false as const,
    ...systemCrudCallbacks,
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const supplies = values.onsite
        ? []
        : values.supplies.map(s => {
            const fromOutpost = outpostsWithId.find(
              o => o.planet === s.fromPlanet && o.system === s.fromSystem
            )
            const relay =
              s.relayPlanet || s.relaySystem
                ? { planet: s.relayPlanet ?? '', system: s.relaySystem ?? '' }
                : null
            return {
              fromOutpostId: fromOutpost?.id ?? null,
              fromPlanet: s.fromPlanet || null,
              fromSystem: s.fromSystem || null,
              relay,
            }
          })

      if (!values.onsite) {
        const unresolved = supplies.filter(s => s.fromPlanet && !s.fromOutpostId)
        if (unresolved.length > 0) {
          toast.error('Could not match Supplied from to an outpost in this network. Check planet and system names.')
          return
        }
      }

      await upsertOutpostResource(outpostId, values.resourceId, {
        onsite: values.onsite,
        origin: values.origin,
        supplies,
      })
      toast.success(isEditing ? 'Resource updated.' : 'Resource added.')
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
                className={`${SF_ICON_CONTROL} text-destructive hover:text-destructive/80`}
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
            <Button type="button" variant="ghost" size="icon" className={SF_ICON_CONTROL} onClick={onDone}>
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
                  <div className={`text-sm px-3 py-1.5 bg-muted/30 rounded-md border border-border text-muted-foreground ${SF_CONTROL} flex items-center`}>
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
                {ingredientList.map((ing: { id: string; abbreviation: string; name: string; satisfied: boolean; count: number }) => (
                  <div key={ing.id} className="flex items-center gap-2">
                    {ing.satisfied
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    }
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{ing.abbreviation}</span>
                    <span className="text-xs flex-1">{ing.name}</span>
                    {ing.count > 1 && (
                      <span className="text-[10px] text-muted-foreground">×{ing.count}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <FormField control={form.control} name="onsite" render={({ field }) => (
              <FormItem className="flex items-start gap-2 space-y-0">
                <Switch
                  id="onsite"
                  checked={field.value}
                  onCheckedChange={v => {
                    field.onChange(v)
                    if (v) form.setValue('origin', false)
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <FormLabel htmlFor="onsite" className="font-normal cursor-pointer">Produced onsite</FormLabel>
                  <p className="text-xs text-muted-foreground">Resource is manufactured or mined at this outpost.</p>
                </div>
              </FormItem>
            )} />

            {!watchOnsite && (
              <FormField control={form.control} name="origin" render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0">
                  <Switch
                    id="origin"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <FormLabel htmlFor="origin" className="font-normal cursor-pointer">Supply origin</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Validation treats this resource as satisfied without tracing upstream. Supplied from and relay still apply for transfer counts and display.
                    </p>
                  </div>
                </FormItem>
              )} />
            )}

            {!watchOnsite && (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-3 rounded-md border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Supply source {fields.length > 1 ? index + 1 : ''}
                      </p>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`${SF_ICON_CONTROL} text-destructive hover:text-destructive/80`}
                          onClick={() => remove(index)}
                          aria-label="Remove supply source"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name={`supplies.${index}.fromPlanet`}
                      render={({ field: planetField }) => (
                        <FormItem>
                          <FormLabel>Supplied from</FormLabel>
                          <PlanetPicker
                            value={planetField.value ?? ''}
                            onChange={v => {
                              planetField.onChange(v)
                              if (!v) form.setValue(`supplies.${index}.fromSystem`, '')
                            }}
                            onSystemChange={v => form.setValue(`supplies.${index}.fromSystem`, v)}
                            placeholder="Select outpost…"
                            {...planetPickerProps}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(watchSupplies?.[index]?.fromPlanet) && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Relay (optional)</p>
                        <FormField
                          control={form.control}
                          name={`supplies.${index}.relayPlanet`}
                          render={({ field: relayField }) => (
                            <FormItem>
                              <FormLabel>Relay location</FormLabel>
                              <PlanetPicker
                                value={relayField.value ?? ''}
                                onChange={v => {
                                  relayField.onChange(v)
                                  if (!v) form.setValue(`supplies.${index}.relaySystem`, '')
                                }}
                                onSystemChange={v => form.setValue(`supplies.${index}.relaySystem`, v)}
                                placeholder="Select relay planet…"
                                {...planetPickerProps}
                              />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="-mx-4 border-t" />
            <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:justify-between">
              {!watchOnsite && (
                <Button
                  type="button"
                  variant="outline"
                  className={`${SF_CONTROL} w-fit shrink-0 gap-1 px-2.5`}
                  onClick={() => append({ fromPlanet: '', fromSystem: '', relayPlanet: '', relaySystem: '' })}
                >
                  <Plus className="h-4 w-4" />
                  Source
                </Button>
              )}
              <div className={`min-w-0 ${!watchOnsite ? 'sm:ml-auto' : 'w-full'}`}>
                <FormActions
                  saving={saving}
                  saved={saved}
                  error={error}
                  saveLabel={isEditing ? 'Save Changes' : 'Add Resource'}
                  formId="outpost-resource-form"
                  onCancel={onDone}
                  buttonClassName={SF_CONTROL}
                />
              </div>
            </div>
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
            <AlertDialogCancel className={SF_CONTROL}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className={`${SF_CONTROL} bg-destructive text-destructive-foreground hover:bg-destructive/90`}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
