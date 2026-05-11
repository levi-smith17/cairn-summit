import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Plus, ChevronUp, Pencil } from 'lucide-react'
import { addCalendarSchema, type AddCalendarFormValues } from '@/lib/schemas/settings'
import {
  addICloudCalendar,
  updateICloudCalendar,
  deleteICloudCalendar,
  addCalendarSubscription,
  updateCalendarSubscription,
  deleteCalendarSubscription,
  updateItinerarySettings,
} from '@/lib/api/settings'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { CustomSelect } from '@/components/ui/custom-select'
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

export type CalendarEntry = {
  id: string
  name: string
  color: string
  appleId: string
}

export type SubscriptionEntry = {
  id: string
  name: string
  url: string
  color: string
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#14b8a6',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-6 w-6 rounded-full ring-offset-2 transition-all"
          style={{ backgroundColor: c, outline: value === c ? `2px solid ${c}` : 'none' }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-6 w-6 rounded cursor-pointer border border-border bg-transparent p-0"
        title="Custom color"
      />
    </div>
  )
}

function SettingRow({ label, description, control }: { label: string; description: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

function CalendarRow({ calendar, onRefresh }: { calendar: CalendarEntry; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(calendar.name)
  const [editColor, setEditColor] = useState(calendar.color)
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onSaveSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateICloudCalendar(calendar.id, { name: editName.trim(), color: editColor })
      onRefresh()
      setEditing(false)
    })
  }

  function handleCancel() {
    setEditName(calendar.name)
    setEditColor(calendar.color)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteICloudCalendar(calendar.id)
    onRefresh()
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div
            className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border"
            style={{ backgroundColor: editing ? editColor : calendar.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {editing ? editName || <span className="text-muted-foreground italic">Untitled</span> : calendar.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">{calendar.appleId}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => editing ? handleCancel() : setEditing(true)}>
            {editing ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0"
            onClick={() => setDeleteOpen(true)} disabled={deleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {editing && (
          <form onSubmit={onSaveSubmit} className="border-t border-border px-3 pb-3 pt-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Display Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Calendar name" className="h-8 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <FormActions saving={saving} saved={saved} error={error} saveLabel="Save" onCancel={handleCancel} />
          </form>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{calendar.name}&quot; from Cairn? Your stops will be kept, but they will no longer sync with iCloud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AddCalendarForm({ onDone }: { onDone: () => void }) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<AddCalendarFormValues>({
    resolver: zodResolver(addCalendarSchema),
    defaultValues: { appleId: '', password: '', calendarName: '', color: '#3b82f6' },
  })

  async function onSubmit(values: AddCalendarFormValues) {
    await handleSubmit(async () => {
      await addICloudCalendar(values)
      onDone()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField control={form.control} name="appleId" render={({ field }) => (
          <FormItem>
            <FormLabel>Apple ID</FormLabel>
            <FormControl><Input type="email" placeholder="you@icloud.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>App-Specific Password</FormLabel>
            <FormControl><Input type="password" placeholder="xxxx-xxxx-xxxx-xxxx" {...field} /></FormControl>
            <FormDescription>
              Generate one at{' '}
              <a href="https://appleid.apple.com/account/manage" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                appleid.apple.com
              </a>
              {' '}— do not use your main iCloud password.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="calendarName" render={({ field }) => (
          <FormItem>
            <FormLabel>Calendar Name</FormLabel>
            <FormControl><Input placeholder="e.g. Home" {...field} /></FormControl>
            <FormDescription>The exact name of the calendar in Apple Calendar.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="color" render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <ColorPicker value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )} />
        <FormActions saving={saving} saved={saved} error={error} saveLabel="Add Calendar" onCancel={onDone} />
      </form>
    </Form>
  )
}

function SubscriptionRow({ sub, onRefresh }: { sub: SubscriptionEntry; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(sub.name)
  const [editColor, setEditColor] = useState(sub.color)
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onSaveSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateCalendarSubscription(sub.id, { name: editName.trim(), color: editColor })
      onRefresh()
      setEditing(false)
    })
  }

  function handleCancel() { setEditName(sub.name); setEditColor(sub.color); setEditing(false) }
  async function handleDelete() { setDeleting(true); await deleteCalendarSubscription(sub.id); onRefresh() }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border" style={{ backgroundColor: editing ? editColor : sub.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {editing ? editName || <span className="text-muted-foreground italic">Untitled</span> : sub.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">{sub.url}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => editing ? handleCancel() : setEditing(true)}>
            {editing ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0"
            onClick={() => setDeleteOpen(true)} disabled={deleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {editing && (
          <form onSubmit={onSaveSubmit} className="border-t border-border px-3 pb-3 pt-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Display Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Calendar name" className="h-8 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <FormActions saving={saving} saved={saved} error={error} saveLabel="Save" onCancel={handleCancel} />
          </form>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscription</AlertDialogTitle>
            <AlertDialogDescription>Remove &quot;{sub.name}&quot; from Cairn? Its events will no longer appear on your itinerary.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AddSubscriptionForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const { saving, saved, error, handleSubmit } = useFormStatus()

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await addCalendarSubscription({ name: name.trim(), url: url.trim(), color })
      onDone()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Display Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. US Holidays" className="h-8 text-sm" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">iCal Feed URL</label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" type="url" className="h-8 text-sm" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <FormActions saving={saving} saved={saved} error={error} saveLabel="Add" onCancel={onDone} />
    </form>
  )
}

interface ItineraryPreferencesValues {
  defaultView: 'MONTH' | 'WEEK' | 'DAY'
  firstDayOfWeek: 'SUNDAY' | 'MONDAY'
  defaultEventDuration: number
  showWeekNumbers: boolean
}

interface ItinerarySettingsFormProps {
  preferences: ItineraryPreferencesValues
  calendars: CalendarEntry[]
  subscriptions: SubscriptionEntry[]
  onRefresh: () => void
}

export function ItinerarySettingsForm({ preferences, calendars, subscriptions, onRefresh }: ItinerarySettingsFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<ItineraryPreferencesValues>(preferences)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddSub, setShowAddSub] = useState(false)

  function set<K extends keyof ItineraryPreferencesValues>(key: K, value: ItineraryPreferencesValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateItinerarySettings(values)
    })
  }

  return (
    <div className="space-y-8">

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preferences</p>

          <SettingRow
            label="Default view"
            description="Which calendar view opens when you navigate to Itinerary"
            control={
              <CustomSelect
                options={[{ value: 'MONTH', label: 'Month' }, { value: 'WEEK', label: 'Week' }, { value: 'DAY', label: 'Day' }]}
                value={values.defaultView}
                onChange={v => set('defaultView', v as ItineraryPreferencesValues['defaultView'])}
                triggerClassName="w-28"
              />
            }
          />

          <SettingRow
            label="First day of week"
            description="Which day the week starts on in calendar views"
            control={
              <CustomSelect
                options={[{ value: 'SUNDAY', label: 'Sunday' }, { value: 'MONDAY', label: 'Monday' }]}
                value={values.firstDayOfWeek}
                onChange={v => set('firstDayOfWeek', v as ItineraryPreferencesValues['firstDayOfWeek'])}
                triggerClassName="w-28"
              />
            }
          />

          <SettingRow
            label="Show week numbers"
            description="Display ISO week numbers alongside calendar rows"
            control={<Switch checked={values.showWeekNumbers} onCheckedChange={v => set('showWeekNumbers', v)} />}
          />

          <SettingRow
            label="Default event duration"
            description="How long new events are set to by default"
            control={
              <CustomSelect
                options={[
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '60', label: '1 hour' },
                  { value: '90', label: '90 min' },
                  { value: '120', label: '2 hours' },
                ]}
                value={String(values.defaultEventDuration)}
                onChange={v => set('defaultEventDuration', Number(v))}
                triggerClassName="w-28"
              />
            }
          />
        </div>

        <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
      </form>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">iCloud Calendars</p>
          <p className="text-sm text-muted-foreground">
            Connect iCloud calendars to overlay their events on your itinerary and sync stops back to Apple Calendar.
          </p>
        </div>
        {calendars.length > 0 && (
          <div className="space-y-2">{calendars.map(cal => <CalendarRow key={cal.id} calendar={cal} onRefresh={onRefresh} />)}</div>
        )}
        {!showAdd ? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full md:w-auto" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />Add Calendar
          </Button>
        ) : (
          <div className="rounded-lg border border-border p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Add Calendar</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAdd(false)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <AddCalendarForm onDone={() => { setShowAdd(false); onRefresh() }} />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Subscribed Calendars</p>
          <p className="text-sm text-muted-foreground">
            Subscribe to read-only iCal feeds (webcal:// or https://) to display external events on your itinerary.
          </p>
        </div>
        {subscriptions.length > 0 && (
          <div className="space-y-2">{subscriptions.map(sub => <SubscriptionRow key={sub.id} sub={sub} onRefresh={onRefresh} />)}</div>
        )}
        {!showAddSub ? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full md:w-auto" onClick={() => setShowAddSub(true)}>
            <Plus className="h-3.5 w-3.5" />Add Subscription
          </Button>
        ) : (
          <div className="rounded-lg border border-border p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Add Subscription</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddSub(false)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <AddSubscriptionForm onDone={() => { setShowAddSub(false); onRefresh() }} />
          </div>
        )}
      </div>

    </div>
  )
}
