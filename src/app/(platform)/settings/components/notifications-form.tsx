'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateNotificationSettings } from '@/actions/settings'

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
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [values, setValues] = useState<NotificationValues>(defaultValues)

  function set<K extends keyof NotificationValues>(key: K, value: NotificationValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(defaultValues)

  async function handleBrowserToggle(enabled: boolean) {
    if (enabled && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    set('browserNotifications', enabled)
  }

  function handleSave() {
    startSave(async () => {
      await updateNotificationSettings(values)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In-App</p>

        <SettingRow
          label="Browser notifications"
          description="Show desktop notifications for new Signals and Relays"
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
          description="Receive a summary of unread signals to your inbox"
          control={
            <Select value={values.emailDigest} onValueChange={v => set('emailDigest', v as NotificationValues['emailDigest'])}>
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEVER">Never</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
