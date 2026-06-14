import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updateSignalSettings, type SignalSettingsValues } from '@/lib/api/signals'

interface SignalsSettingsFormProps {
  defaultValues: SignalSettingsValues
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

export function SignalsSettingsForm({ defaultValues }: SignalsSettingsFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<SignalSettingsValues>(defaultValues)

  function set<K extends keyof SignalSettingsValues>(key: K, value: SignalSettingsValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleBrowserToggle(enabled: boolean) {
    if (enabled && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    set('browserNotifications', enabled)
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateSignalSettings(values)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inbox</p>

        <SettingRow
          label="Auto-mark read"
          description="Mark a signal as read when you open it"
          control={
            <Switch
              checked={values.autoMarkRead}
              onCheckedChange={v => set('autoMarkRead', v)}
            />
          }
        />

        <SettingRow
          label="Show snippets"
          description="Preview message text in the list"
          control={
            <Switch
              checked={values.showSnippets}
              onCheckedChange={v => set('showSnippets', v)}
            />
          }
        />

        <SettingRow
          label="Messages per page"
          description="How many threads to show per page"
          control={
            <CustomSelect
              options={[10, 15, 25, 50].map(n => ({ value: String(n), label: String(n) }))}
              value={String(values.messagesPerPage)}
              onChange={v => set('messagesPerPage', Number(v))}
              triggerClassName="w-20"
            />
          }
        />
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notifications</p>

        <SettingRow
          label="Browser notifications"
          description="Show desktop notifications for new contact-form messages"
          control={
            <Switch
              checked={values.browserNotifications}
              onCheckedChange={handleBrowserToggle}
            />
          }
        />

        <SettingRow
          label="Notification sound"
          description="Play a sound when new messages arrive"
          control={
            <Switch
              checked={values.notificationSound}
              onCheckedChange={v => set('notificationSound', v)}
            />
          }
        />

        <SettingRow
          label="Refresh interval"
          description="How often to check for new messages (seconds)"
          control={
            <CustomSelect
              options={[15, 30, 60, 120].map(n => ({ value: String(n), label: `${n}s` }))}
              value={String(values.autoRefreshInterval)}
              onChange={v => set('autoRefreshInterval', Number(v))}
              triggerClassName="w-20"
            />
          }
        />
      </div>

      <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
    </form>
  )
}
