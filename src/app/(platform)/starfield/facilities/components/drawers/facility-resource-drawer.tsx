'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveFacilityResource, saveSystem, savePlanet } from '@/actions/starfield'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Plus, X } from 'lucide-react'

const schema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  resourceId: z.string().min(1, 'Resource is required'),
  planetId: z.string().min(1, 'Planet is required'),
  subfacility1Id: z.string().optional(),
  subfacility2Id: z.string().optional(),
  subfacility3Id: z.string().optional(),
  relayId: z.string().optional(),
  onsite: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

// ── InlinePlanetCreator ───────────────────────────────────────────────────────

interface InlinePlanetCreatorProps {
  label: string
  systems: any[]
  onCreated: (planet: any, updatedSystems: any[]) => void
  onCancel: () => void
}

function InlinePlanetCreator({ label, systems, onCreated, onCancel }: InlinePlanetCreatorProps) {
  const [systemId, setSystemId] = useState('')
  const [newSystemName, setNewSystemName] = useState('')
  const [planetName, setPlanetName] = useState('')
  const [creatingSystem, setCreatingSystem] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!planetName) return
    setSaving(true)
    try {
      let finalSystemId = systemId
      let updatedSystems = [...systems]

      if (creatingSystem) {
        const newSystem = await saveSystem(newSystemName)
        finalSystemId = newSystem.id
        updatedSystems = [...systems, { ...newSystem, planets: [] }]
      }

      const planet = await savePlanet(planetName, finalSystemId)
      updatedSystems = updatedSystems.map(s =>
        s.id === finalSystemId
          ? { ...s, planets: [...s.planets, planet] }
          : s
      )
      onCreated(planet, updatedSystems)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border border-border p-3 space-y-3 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {!creatingSystem ? (
        <div className="space-y-2">
          <Select value={systemId} onValueChange={setSystemId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select system..." />
            </SelectTrigger>
            <SelectContent>
              {systems.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCreatingSystem(true)}>
            <Plus className="h-3 w-3 mr-1" /> New System
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            className="h-8 text-xs"
            placeholder="System name..."
            value={newSystemName}
            onChange={e => setNewSystemName(e.target.value)}
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreatingSystem(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <Input
        className="h-8 text-xs"
        placeholder="Planet name..."
        value={planetName}
        onChange={e => setPlanetName(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs"
          onClick={handleSave}
          disabled={saving || !planetName || (!systemId && !newSystemName)}
        >
          {saving ? 'Saving...' : 'Save Planet'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ── PlanetSelect ──────────────────────────────────────────────────────────────

interface PlanetSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  systems: any[]
  onSystemsUpdate: (systems: any[]) => void
  optional?: boolean
}

function PlanetSelect({ label, value, onChange, systems, onSystemsUpdate, optional }: PlanetSelectProps) {
  const [creating, setCreating] = useState(false)

  const allPlanets = systems
    .flatMap(s => s.planets.map((p: any) => ({ ...p, systemName: s.name, label: `${p.name} (${s.name})` })))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="space-y-2">
      <FormLabel>
        {label}
        {optional && <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
      </FormLabel>
      {!creating ? (
        <div className="flex gap-2">
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a planet..." />
            </SelectTrigger>
            <SelectContent>
              {optional && <SelectItem value="none">None</SelectItem>}
              {allPlanets.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <InlinePlanetCreator
          label={`New planet for ${label}`}
          systems={systems}
          onCreated={(planet, updatedSystems) => {
            onSystemsUpdate(updatedSystems)
            onChange(planet.id)
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  )
}

// ── FacilityResourceDrawer ────────────────────────────────────────────────────

interface FacilityResourceDrawerProps {
  open: boolean
  onClose: () => void
  facilityResource?: any
  facilities: any[]
  resources: any[]
  systems: any[]
  defaultFacilityId?: string | null
}

export function FacilityResourceDrawer({
  open,
  onClose,
  facilityResource,
  facilities,
  resources,
  systems: initialSystems,
  defaultFacilityId,
}: FacilityResourceDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [systems, setSystems] = useState(initialSystems)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      facilityId: '',
      resourceId: '',
      planetId: '',
      subfacility1Id: '',
      subfacility2Id: '',
      subfacility3Id: '',
      relayId: '',
      onsite: false,
    },
  })

  // Reset with existing values when drawer opens — matches TagDrawer pattern
  useEffect(() => {
    if (open) {
      setSystems(initialSystems)
      form.reset({
        facilityId: facilityResource?.facilityId ?? defaultFacilityId ?? '',
        resourceId: facilityResource?.resourceId ?? '',
        planetId: facilityResource?.planetId ?? '',
        subfacility1Id: facilityResource?.subfacility1Id ?? '',
        subfacility2Id: facilityResource?.subfacility2Id ?? '',
        subfacility3Id: facilityResource?.subfacility3Id ?? '',
        relayId: facilityResource?.relayId ?? '',
        onsite: facilityResource?.onsite ?? false,
      })
    }
  }, [open, facilityResource, defaultFacilityId])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveFacilityResource({
        id: facilityResource?.id,
        facilityId: values.facilityId,
        resourceId: values.resourceId,
        planetId: values.planetId,
        subfacility1Id: values.subfacility1Id || null,
        subfacility2Id: values.subfacility2Id || null,
        subfacility3Id: values.subfacility3Id || null,
        relayId: values.relayId || null,
        onsite: values.onsite,
      })
      form.reset()
      onClose()
    })
  }

  const sortedResources = [...resources].sort((a, b) => a.name.localeCompare(b.name))
  const sortedFacilities = [...facilities].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{facilityResource ? 'Edit Resource' : 'Add Resource'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form id="facility-resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select facility..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortedFacilities.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.planet.name} [{f.abbreviation}] {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select resource..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortedResources.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} ({r.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planetId"
                render={({ field }) => (
                  <FormItem>
                    <PlanetSelect
                      label="Planet"
                      value={field.value}
                      onChange={field.onChange}
                      systems={systems}
                      onSystemsUpdate={setSystems}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subfacility1Id"
                render={({ field }) => (
                  <FormItem>
                    <PlanetSelect
                      label="Subfacility 1"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      systems={systems}
                      onSystemsUpdate={setSystems}
                      optional
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subfacility2Id"
                render={({ field }) => (
                  <FormItem>
                    <PlanetSelect
                      label="Subfacility 2"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      systems={systems}
                      onSystemsUpdate={setSystems}
                      optional
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subfacility3Id"
                render={({ field }) => (
                  <FormItem>
                    <PlanetSelect
                      label="Subfacility 3"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      systems={systems}
                      onSystemsUpdate={setSystems}
                      optional
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relayId"
                render={({ field }) => (
                  <FormItem>
                    <PlanetSelect
                      label="Relay"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      systems={systems}
                      onSystemsUpdate={setSystems}
                      optional
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onsite"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Mined onsite</FormLabel>
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
            saveLabel={facilityResource ? 'Save Resource' : 'Add Resource'}
            formId="facility-resource-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}