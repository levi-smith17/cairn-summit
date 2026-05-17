import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { createKin, updateKin, deleteKin } from '@/lib/api/headwaters'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { KinPicker } from '@/components/ui/kin-picker'
import { PartialDateInput } from '@/components/ui/partial-date-input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import type { Kin, Bloodline } from '@cairn/types'
import { useTerminology } from '@/contexts/terminology-context'
import { kinFullName, kinDisplayName, getDescendantIds, isEligibleParent } from './kin-node'

const schema = z.object({
  givenName: z.string().min(1, 'Given name is required'),
  middleName: z.string().optional(),
  nickname: z.string(),
  surname: z.string().min(1, 'Surname is required'),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  fatherId: z.string().optional(),
  fatherUnknown: z.boolean(),
  motherId: z.string().optional(),
  motherUnknown: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const END_REASON_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'DIVORCE', label: 'Divorce' },
  { value: 'DEATH', label: 'Death' },
  { value: 'SEPARATION', label: 'Separation' },
]

interface NewBloodlineForm {
  kinId: string
  startDate: string
  endDate: string
  endReason: string
  current: boolean
}

interface KinFormProps {
  kin?: Kin & { id: string }
  isNew?: boolean
  allKin: (Kin & { id: string })[]
  onDone: () => void
  onRefresh: () => void
}

export function KinForm({ kin, isNew = false, allKin, onDone, onRefresh }: KinFormProps) {
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bloodlines, setBloodlines] = useState<Bloodline[]>(kin?.bloodlines ?? [])
  const [showAddBloodline, setShowAddBloodline] = useState(false)
  const [bloodlinesExpanded, setBloodlinesExpanded] = useState(true)
  const [newBloodline, setNewBloodline] = useState<NewBloodlineForm>({
    kinId: '',
    startDate: '',
    endDate: '',
    endReason: '',
    current: false,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      givenName: kin?.givenName ?? '',
      middleName: kin?.middleName ?? '',
      nickname: kin?.nickname ?? '',
      surname: kin?.surname ?? '',
      birthDate: kin?.birthDate ?? '',
      deathDate: kin?.deathDate ?? '',
      fatherId: kin?.fatherId ?? '',
      fatherUnknown: kin?.fatherUnknown ?? false,
      motherId: kin?.motherId ?? '',
      motherUnknown: kin?.motherUnknown ?? false,
    },
  })

  const otherKin = allKin.filter(k => k.id !== kin?.id)
  const descendantIds = kin?.id ? getDescendantIds(kin.id, allKin) : new Set<string>()
  const eligibleParents = otherKin.filter(k =>
    !descendantIds.has(k.id) && isEligibleParent(k, { birthDate: kin?.birthDate })
  )
  const toOption = (k: Kin & { id: string }) => ({ value: k.id, label: kinDisplayName(k) })
  const sortedEligible = eligibleParents.map(toOption).sort((a, b) => a.label.localeCompare(b.label))
  const bloodlineOptions = [
    { value: '', label: 'None' },
    ...otherKin
      .map(k => ({ value: k.id, label: kinDisplayName(k) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]

  const currentBloodline = bloodlines.find(b => b.current)
  const pastBloodlines = bloodlines.filter(b => !b.current)

  function getKinName(kinId: string): string {
    const found = otherKin.find(k => k.id === kinId)
    return found ? kinFullName(found) : kinId
  }

  function handleCurrentSpouseChange(kinId: string) {
    if (!kinId) {
      setBloodlines(prev => prev.map(b => ({ ...b, current: false })))
      return
    }
    const existing = bloodlines.find(b => b.kinId === kinId)
    if (existing) {
      setBloodlines(prev => prev.map(b => ({ ...b, current: b.kinId === kinId })))
    } else {
      setBloodlines(prev => [
        ...prev.map(b => ({ ...b, current: false })),
        {
          id: crypto.randomUUID(),
          kinId,
          kinName: getKinName(kinId),
          current: true,
        },
      ])
    }
  }

  function handleAddBloodline() {
    if (!newBloodline.kinId) return
    const entry: Bloodline = {
      id: crypto.randomUUID(),
      kinId: newBloodline.kinId,
      kinName: getKinName(newBloodline.kinId),
      startDate: newBloodline.startDate || undefined,
      endDate: newBloodline.endDate || undefined,
      endReason: (newBloodline.endReason as Bloodline['endReason']) || undefined,
      current: newBloodline.current,
    }
    if (newBloodline.current) {
      setBloodlines(prev => [
        ...prev.map(b => ({ ...b, current: false })),
        entry,
      ])
    } else {
      setBloodlines(prev => [...prev, entry])
    }
    setNewBloodline({ kinId: '', startDate: '', endDate: '', endReason: '', current: false })
    setShowAddBloodline(false)
  }

  function handleRemoveBloodline(id: string) {
    setBloodlines(prev => prev.filter(b => b.id !== id))
  }

  async function applyReciprocalBloodline(
    selfId: string,
    selfName: string,
    newBloodlines: Bloodline[],
    prevBloodlines: Bloodline[]
  ) {
    const newPartner = newBloodlines.find(b => b.current)
    const prevPartnerId = prevBloodlines.find(b => b.current)?.kinId

    if (prevPartnerId && prevPartnerId !== newPartner?.kinId) {
      const prev = allKin.find(k => k.id === prevPartnerId)
      if (prev) {
        await updateKin(prevPartnerId, {
          givenName: prev.givenName, middleName: prev.middleName, nickname: prev.nickname,
          surname: prev.surname,
          birthDate: prev.birthDate, deathDate: prev.deathDate,
          fatherId: prev.fatherId, fatherUnknown: prev.fatherUnknown,
          motherId: prev.motherId, motherUnknown: prev.motherUnknown,
          bloodlines: prev.bloodlines.map(b => b.kinId === selfId ? { ...b, current: false } : b),
        })
      }
    }

    if (newPartner) {
      const partner = allKin.find(k => k.id === newPartner.kinId)
      if (partner) {
        const existing = partner.bloodlines.find(b => b.kinId === selfId)
        const updatedBloodlines = existing
          ? partner.bloodlines.map(b => b.kinId === selfId
              ? { ...b, current: true, startDate: newPartner.startDate }
              : { ...b, current: false }
            )
          : [
              ...partner.bloodlines.map(b => ({ ...b, current: false })),
              { id: crypto.randomUUID(), kinId: selfId, kinName: selfName, current: true, startDate: newPartner.startDate },
            ]
        await updateKin(newPartner.kinId, {
          givenName: partner.givenName, middleName: partner.middleName, nickname: partner.nickname,
          surname: partner.surname,
          birthDate: partner.birthDate, deathDate: partner.deathDate,
          fatherId: partner.fatherId, fatherUnknown: partner.fatherUnknown,
          motherId: partner.motherId, motherUnknown: partner.motherUnknown,
          bloodlines: updatedBloodlines,
        })
      }
    }
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const payload = {
        givenName: values.givenName,
        middleName: values.middleName || undefined,
        nickname: values.nickname || undefined,
        surname: values.surname,
        birthDate: values.birthDate || undefined,
        deathDate: values.deathDate || undefined,
        fatherId: values.fatherUnknown ? undefined : (values.fatherId || undefined),
        fatherUnknown: values.fatherUnknown,
        motherId: values.motherUnknown ? undefined : (values.motherId || undefined),
        motherUnknown: values.motherUnknown,
        bloodlines,
      }

      if (kin?.id && !isNew) {
        await updateKin(kin.id, payload)
        const selfName = [values.givenName, values.middleName, values.surname].filter(Boolean).join(' ')
        await applyReciprocalBloodline(kin.id, selfName, bloodlines, kin.bloodlines ?? [])
      } else {
        const created = await createKin({ ...payload, isSelf: isNew && !!kin ? true : undefined })
        if (created?.sk) {
          const selfId = created.sk.replace('KIN#', '')
          const selfName = [values.givenName, values.middleName, values.surname].filter(Boolean).join(' ')
          await applyReciprocalBloodline(selfId, selfName, bloodlines, [])
        }
      }
      onRefresh()
      onDone()
    })
  }

  async function handleDelete() {
    if (!kin?.id) return
    try {
      await deleteKin(kin.id)
      toast.success(`${terms.kin} removed.`)
      onRefresh()
      onDone()
    } catch {
      toast.error('Failed to remove kin.')
    }
  }

  const fatherUnknown = form.watch('fatherUnknown')
  const motherUnknown = form.watch('motherUnknown')
  const watchedFatherId = form.watch('fatherId')
  const watchedMotherId = form.watch('motherId')
  const fatherPickerOptions = [{ value: '', label: 'None' }, ...sortedEligible.filter(o => o.value !== watchedMotherId)]
  const motherPickerOptions = [{ value: '', label: 'None' }, ...sortedEligible.filter(o => o.value !== watchedFatherId)]
  const isSelf = (isNew && !!kin) || kin?.id === 'WAYFARER'
  const titleLabel = isSelf ? 'Edit Yourself' : kin && !isNew ? `Edit ${terms.kin}` : `Add ${terms.kin}`
  const saveLabel = isSelf ? 'Save' : kin && !isNew ? 'Save Changes' : `Add ${terms.kin}`
  const canDelete = kin && !isNew && kin.id !== 'WAYFARER'

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium flex-1">{titleLabel}</span>
          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive/80"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove {terms.kin.toLowerCase()}</TooltipContent>
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
            <form id="kin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Name */}
              <FormField control={form.control} name="givenName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Given Name</FormLabel>
                  <Input className="md:h-8" placeholder="First name" {...field} />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="middleName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <Input className="md:h-8" placeholder="Middle name" {...field} />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="surname" render={({ field }) => (
                <FormItem>
                  <FormLabel>Surname</FormLabel>
                  <Input className="md:h-8" placeholder="Last name" {...field} />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nickname" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <Input className="md:h-8" placeholder="Nickname" {...field} />
                  <FormMessage />
                </FormItem>
              )} />

              <div className="-mx-4 border-t" />

              {/* Dates */}
              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Date <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <PartialDateInput value={field.value ?? ''} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="deathDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Death Date <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <PartialDateInput value={field.value ?? ''} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />

              <div className="-mx-4 border-t" />

              {/* Parents */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parents</p>

                <FormField control={form.control} name="fatherId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father</FormLabel>
                    <div className="space-y-1.5">
                      <KinPicker
                        options={fatherPickerOptions}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Select father…"
                        triggerClassName="w-full"
                        disabled={fatherUnknown}
                      />
                      <FormField control={form.control} name="fatherUnknown" render={({ field: uf }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={uf.value}
                            onCheckedChange={checked => {
                              uf.onChange(checked)
                              if (checked) form.setValue('fatherId', '')
                            }}
                          />
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        </label>
                      )} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="motherId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother</FormLabel>
                    <div className="space-y-1.5">
                      <KinPicker
                        options={motherPickerOptions}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Select mother…"
                        triggerClassName="w-full"
                        disabled={motherUnknown}
                      />
                      <FormField control={form.control} name="motherUnknown" render={({ field: uf }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={uf.value}
                            onCheckedChange={checked => {
                              uf.onChange(checked)
                              if (checked) form.setValue('motherId', '')
                            }}
                          />
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        </label>
                      )} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="-mx-4 border-t" />

              {/* Bloodlines */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 w-full text-left"
                  onClick={() => setBloodlinesExpanded(v => !v)}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">Bloodlines</p>
                  {bloodlinesExpanded
                    ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </button>

                {bloodlinesExpanded && (
                  <div className="space-y-2">
                    {/* Current marriage */}
                    <div>
                      <FormLabel className="text-xs">Current Marriage</FormLabel>
                      <div className="mt-1.5 space-y-1.5">
                        <KinPicker
                          options={bloodlineOptions}
                          value={currentBloodline?.kinId ?? ''}
                          onChange={handleCurrentSpouseChange}
                          placeholder="None"
                          triggerClassName="w-full"
                        />
                        {currentBloodline && (
                          <div>
                            <FormLabel className="text-xs text-muted-foreground">Since <span className="font-normal">(optional)</span></FormLabel>
                            <Input
                              type="date"
                              className="mt-1 h-8"
                              value={currentBloodline.startDate ?? ''}
                              onChange={e => setBloodlines(prev => prev.map(b =>
                                b.current ? { ...b, startDate: e.target.value || undefined } : b
                              ))}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Past bloodlines */}
                    {pastBloodlines.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Past</p>
                        {pastBloodlines.map(bl => {
                          const years = [bl.startDate?.slice(0, 4), bl.endDate?.slice(0, 4)].filter(Boolean).join(' – ')
                          return (
                            <div key={bl.id} className="flex items-center gap-2 bg-muted/40 rounded px-2 py-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{bl.kinName}</p>
                                {(years || bl.endReason) && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {[years, bl.endReason?.toLowerCase()].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                onClick={() => handleRemoveBloodline(bl.id)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add bloodline */}
                    {showAddBloodline ? (
                      <div className="border border-border rounded-md p-3 space-y-2">
                        <p className="text-xs font-medium">Add Bloodline</p>
                        <div>
                          <FormLabel className="text-xs">Partner</FormLabel>
                          <div className="mt-1">
                            <KinPicker
                              options={bloodlineOptions.filter(o => o.value !== '')}
                              value={newBloodline.kinId}
                              onChange={v => setNewBloodline(p => ({ ...p, kinId: v }))}
                              placeholder="Select partner…"
                              triggerClassName="w-full"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <FormLabel className="text-xs">Start Date</FormLabel>
                            <Input
                              type="date"
                              className="mt-1 h-8"
                              value={newBloodline.startDate}
                              onChange={e => setNewBloodline(p => ({ ...p, startDate: e.target.value }))}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">End Date</FormLabel>
                            <Input
                              type="date"
                              className="mt-1 h-8"
                              value={newBloodline.endDate}
                              onChange={e => setNewBloodline(p => ({ ...p, endDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <FormLabel className="text-xs">End Reason</FormLabel>
                          <div className="mt-1">
                            <CustomSelect
                              options={END_REASON_OPTIONS}
                              value={newBloodline.endReason}
                              onChange={v => setNewBloodline(p => ({ ...p, endReason: v }))}
                              placeholder="Unspecified"
                              triggerClassName="w-full"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={newBloodline.current}
                            onCheckedChange={v => setNewBloodline(p => ({ ...p, current: !!v }))}
                          />
                          <span className="text-xs text-muted-foreground">Current marriage</span>
                        </label>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" className="h-7 text-xs" onClick={handleAddBloodline} disabled={!newBloodline.kinId}>
                            Add
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddBloodline(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 md:h-8 text-sm gap-1.5 w-full justify-start"
                        onClick={() => setShowAddBloodline(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Bloodline
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="-mx-4 border-t" />
              <FormActions
                saving={saving}
                saved={saved}
                error={error}
                saveLabel={saveLabel}
                formId="kin-form"
                onCancel={onDone}
              />
            </form>
          </Form>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove kin</AlertDialogTitle>
            <AlertDialogDescription>
              {canDelete
                ? `Remove "${[kin.givenName, kin.middleName, kin.surname].filter(Boolean).join(' ')}" from the lineage? This cannot be undone.`
                : 'Remove this kin? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
