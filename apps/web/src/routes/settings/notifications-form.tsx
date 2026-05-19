import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updateNotificationSettings } from '@/lib/api/settings'

interface NotificationValues {
  browserNotifications: boolean
  notificationSound: boolean
  emailDigest: 'NEVER' | 'DAILY' | 'WEEKLY'
}

interface NotificationsFormProps {
  defaultValues: NotificationValues
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

export function NotificationsForm({ defaultValues }: NotificationsFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<NotificationValues>(defaultValues)

  function set<K extends keyof NotificationValues>(key: K, value: NotificationValues[K]) {
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
      await updateNotificationSettings(values)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In-App</p>

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
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>

        <SettingRow
          label="Email digest"
          description="Receive a digest of your activity to your inbox"
          control={
            <CustomSelect
              options={[{ value: 'NEVER', label: 'Never' }, { value: 'DAILY', label: 'Daily' }, { value: 'WEEKLY', label: 'Weekly' }]}
              value={values.emailDigest}
              onChange={v => set('emailDigest', v as NotificationValues['emailDigest'])}
              triggerClassName="w-28"
            />
          }
        />
      </div>

      <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
    </form>
  )
}
