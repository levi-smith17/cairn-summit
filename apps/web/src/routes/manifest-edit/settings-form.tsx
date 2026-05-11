import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saveManifestSettings, deleteAccount } from '@/lib/api/manifest'
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas/manifest'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface SettingsFormProps {
  defaultValues: {
    username: string | null
    defaultTerminology: 'CAIRN' | 'STANDARD'
    defaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
    listed: boolean
    customDomain: string | null
  }
  isAdmin?: boolean
}

export function SettingsForm({ defaultValues, isAdmin }: SettingsFormProps) {
  const navigate = useNavigate()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/')
    } finally {
      setDeleting(false)
    }
  }

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: defaultValues.username ?? '',
      defaultTerminology: defaultValues.defaultTerminology,
      defaultTheme: defaultValues.defaultTheme,
      listed: defaultValues.listed,
      customDomain: defaultValues.customDomain ?? '',
    },
  })

  async function onSubmit(values: SettingsFormValues) {
    await handleSubmit(() => saveManifestSettings({
      username: values.username || null,
      defaultTerminology: values.defaultTerminology,
      defaultTheme: values.defaultTheme,
      listed: values.listed,
      customDomain: values.customDomain || null,
    }))
  }

  const username = form.watch('username')
  const customDomain = form.watch('customDomain')

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="e.g. levi" {...field} />
              </FormControl>
              <FormDescription>
                {username
                  ? <>Your Manifest is available at{' '}
                      <a
                        href={`/manifest/${username}`}
                        className="underline underline-offset-4 hover:text-foreground"
                      >
                        /manifest/{username}
                      </a>
                    </>
                  : 'Choose a unique username for your public manifest URL'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAdmin && (
        <FormField
          control={form.control}
          name="customDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Domain</FormLabel>
              <FormControl>
                <Input placeholder="e.g. mysite.com" {...field} />
              </FormControl>
              <FormDescription>
                {customDomain
                  ? <>Point your domain's DNS to Cairn's IP, then visitors can reach your Manifest at <strong>{customDomain}</strong>.</>
                  : 'Optionally serve your Manifest from your own domain. Point its DNS to Cairn first.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        )}

        <FormField
          control={form.control}
          name="listed"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="flex flex-col gap-1">
                <FormLabel>List me in the Wayfarer Directory</FormLabel>
                <FormDescription>
                  When enabled your Manifest will appear in the public directory on the homepage.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultTerminology"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Terminology</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CAIRN">Cairn (Origins, Expeditions, etc.)</SelectItem>
                  <SelectItem value="STANDARD">Standard (Bio, Work Experience, etc.)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This sets the default section labels on your public Manifest. Visitors can toggle between both.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultTheme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Theme for Visitors</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SYSTEM">System (follows visitor's preference)</SelectItem>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Sets the default theme when visitors view your public Manifest page.
                Visitors can still toggle it themselves.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
      </form>
    </Form>

    <div className="rounded-lg border border-destructive/40 p-4 space-y-3 mt-6">
      <div>
        <p className="text-sm font-medium text-destructive">Delete Account</p>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
      </div>
      <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
        Delete Account
      </Button>
    </div>

    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your manifest, all entries, messages, and account data.
            This cannot be undone. Type <strong>DELETE</strong> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="mt-2"
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={confirmText !== 'DELETE' || deleting}
            onClick={handleDeleteAccount}
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
