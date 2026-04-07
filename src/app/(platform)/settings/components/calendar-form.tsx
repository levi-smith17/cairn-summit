'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Plus, ChevronUp, Pencil } from 'lucide-react'
import { addCalendarSchema, type AddCalendarFormValues } from '@/lib/schemas/settings'
import { addICloudCalendar, updateICloudCalendar, deleteICloudCalendar, addCalendarSubscription, updateCalendarSubscription, deleteCalendarSubscription } from '@/actions/settings'
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
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
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
import type { CalendarEntry, SubscriptionEntry } from './settings-client'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#14b8a6',
]

interface CalendarFormProps {
  calendars: CalendarEntry[]
  subscriptions: SubscriptionEntry[]
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-6 w-6 rounded-full ring-offset-2 transition-all"
          style={{
            backgroundColor: c,
            outline: value === c ? `2px solid ${c}` : 'none',
          }}
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

function CalendarRow({ calendar }: { calendar: CalendarEntry }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(calendar.name)
  const [editColor, setEditColor] = useState(calendar.color)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (!editName.trim()) return
    setSaving(true)
    await updateICloudCalendar(calendar.id, { name: editName.trim(), color: editColor })
    router.refresh()
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setEditName(calendar.name)
    setEditColor(calendar.color)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteICloudCalendar(calendar.id)
    router.refresh()
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        {/* Summary row */}
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => editing ? handleCancel() : setEditing(true)}
          >
            {editing ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive/80 shrink-0"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Inline edit panel */}
        {editing && (
          <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Display Name</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Calendar name"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <div className="flex justify-end items-center gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !editName.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{calendar.name}&quot; from Cairn? Your stops will be kept, but they
              will no longer sync with iCloud.
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

function AddCalendarForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<AddCalendarFormValues>({
    resolver: zodResolver(addCalendarSchema),
    defaultValues: {
      appleId: '',
      password: '',
      calendarName: '',
      color: '#3b82f6',
    },
  })

  async function onSubmit(values: AddCalendarFormValues) {
    await handleSubmit(async () => {
      await addICloudCalendar(values)
      router.refresh()
      onDone()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="appleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apple ID</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@icloud.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App-Specific Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="xxxx-xxxx-xxxx-xxxx" {...field} />
              </FormControl>
              <FormDescription>
                Generate one at{' '}
                <a
                  href="https://appleid.apple.com/account/manage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  appleid.apple.com
                </a>
                {' '}— do not use your main iCloud password.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="calendarName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calendar Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Home" {...field} />
              </FormControl>
              <FormDescription>
                The exact name of the calendar in Apple Calendar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <ColorPicker value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormActions
          saving={saving}
          saved={saved}
          error={error}
          saveLabel="Add Calendar"
          onCancel={onDone}
        />
      </form>
    </Form>
  )
}

function SubscriptionRow({ sub }: { sub: SubscriptionEntry }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(sub.name)
  const [editColor, setEditColor] = useState(sub.color)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (!editName.trim()) return
    setSaving(true)
    await updateCalendarSubscription(sub.id, { name: editName.trim(), color: editColor })
    router.refresh()
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setEditName(sub.name)
    setEditColor(sub.color)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteCalendarSubscription(sub.id)
    router.refresh()
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div
            className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border"
            style={{ backgroundColor: editing ? editColor : sub.color }}
          />
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
          <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Display Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Calendar name" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <div className="flex justify-end items-center gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !editName.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{sub.name}&quot; from Cairn? Its events will no longer appear on your itinerary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AddSubscriptionForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    setSaving(true)
    setError(null)
    try {
      await addCalendarSubscription({ name: name.trim(), url: url.trim(), color })
      router.refresh()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscription')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
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
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || !name.trim() || !url.trim()}>
          {saving ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

export function CalendarForm({ calendars, subscriptions }: CalendarFormProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [showAddSub, setShowAddSub] = useState(false)

  return (
    <div className="space-y-8">
      {/* ── iCloud Calendars ── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">iCloud Calendars</p>
          <p className="text-sm text-muted-foreground">
            Connect iCloud calendars to overlay their events on your itinerary and sync stops back to Apple Calendar.
          </p>
        </div>

        {calendars.length > 0 && (
          <div className="space-y-2">
            {calendars.map(cal => (
              <CalendarRow key={cal.id} calendar={cal} />
            ))}
          </div>
        )}

        {!showAdd ? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Calendar
          </Button>
        ) : (
          <div className="rounded-lg border border-border p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Add Calendar</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAdd(false)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <AddCalendarForm onDone={() => setShowAdd(false)} />
          </div>
        )}
      </div>

      {/* ── Calendar Subscriptions ── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Subscribed Calendars</p>
          <p className="text-sm text-muted-foreground">
            Subscribe to read-only iCal feeds (webcal:// or https://) to display external events on your itinerary.
          </p>
        </div>

        {subscriptions.length > 0 && (
          <div className="space-y-2">
            {subscriptions.map(sub => (
              <SubscriptionRow key={sub.id} sub={sub} />
            ))}
          </div>
        )}

        {!showAddSub ? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAddSub(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Subscription
          </Button>
        ) : (
          <div className="rounded-lg border border-border p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Add Subscription</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddSub(false)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <AddSubscriptionForm onDone={() => setShowAddSub(false)} />
          </div>
        )}
      </div>
    </div>
  )
}
