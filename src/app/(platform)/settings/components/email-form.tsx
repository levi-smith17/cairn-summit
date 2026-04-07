'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Plus, ChevronUp, Pencil, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { addImapAccountSchema, type AddImapAccountFormValues } from '@/lib/schemas/settings'
import {
  addImapAccount,
  updateImapAccount,
  deleteImapAccount,
  testImapConnectionAction,
} from '@/actions/settings'
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
import type { ImapAccountEntry } from './settings-client'

interface AccountRowProps {
  account: ImapAccountEntry
}

function AccountRow({ account }: AccountRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [label, setLabel]           = useState(account.label)
  const [emailAddress, setEmailAddress] = useState(account.emailAddress)
  const [imapHost, setImapHost]     = useState(account.imapHost)
  const [imapPort, setImapPort]     = useState(account.imapPort)
  const [imapSecure, setImapSecure] = useState(account.imapSecure)
  const [smtpHost, setSmtpHost]     = useState(account.smtpHost)
  const [smtpPort, setSmtpPort]     = useState(account.smtpPort)
  const [smtpSecure, setSmtpSecure] = useState(account.smtpSecure)
  const [isDefault, setIsDefault]   = useState(account.isDefault)

  function handleCancel() {
    setLabel(account.label)
    setEmailAddress(account.emailAddress)
    setImapHost(account.imapHost)
    setImapPort(account.imapPort)
    setImapSecure(account.imapSecure)
    setSmtpHost(account.smtpHost)
    setSmtpPort(account.smtpPort)
    setSmtpSecure(account.smtpSecure)
    setIsDefault(account.isDefault)
    setEditing(false)
  }

  async function handleSave() {
    if (!label.trim()) return
    setSaving(true)
    await updateImapAccount(account.id, { label, emailAddress, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure, isDefault })
    router.refresh()
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteImapAccount(account.id)
    router.refresh()
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{account.label}</span>
              {account.isDefault && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary shrink-0">default</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">{account.emailAddress}</div>
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

        {editing && (
          <div className="border-t border-border px-3 pb-3 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Label</label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Work" className="h-8 text-sm" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                <Input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">IMAP Host</label>
                <Input value={imapHost} onChange={e => setImapHost(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">IMAP Port</label>
                <Input type="number" value={imapPort} onChange={e => setImapPort(Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Switch checked={imapSecure} onCheckedChange={setImapSecure} id={`imap-secure-${account.id}`} />
                <label htmlFor={`imap-secure-${account.id}`} className="text-xs text-muted-foreground cursor-pointer">IMAP SSL/TLS</label>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">SMTP Host</label>
                <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">SMTP Port</label>
                <Input type="number" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Switch checked={smtpSecure} onCheckedChange={setSmtpSecure} id={`smtp-secure-${account.id}`} />
                <label htmlFor={`smtp-secure-${account.id}`} className="text-xs text-muted-foreground cursor-pointer">SMTP SSL/TLS</label>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} id={`default-${account.id}`} />
                <label htmlFor={`default-${account.id}`} className="text-xs text-muted-foreground cursor-pointer">Set as default account</label>
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !label.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove account</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{account.label}&quot; ({account.emailAddress})? Cached emails will be deleted.
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

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [testPending, startTest] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const form = useForm<AddImapAccountFormValues>({
    resolver: zodResolver(addImapAccountSchema),
    defaultValues: {
      label: '',
      emailAddress: '',
      imapHost: '',
      imapPort: 993,
      imapSecure: true,
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      username: '',
      password: '',
      isDefault: false,
    },
  })

  function handleTest() {
    const values = form.getValues()
    setTestResult(null)
    startTest(async () => {
      const result = await testImapConnectionAction({
        imapHost: values.imapHost,
        imapPort: values.imapPort,
        imapSecure: values.imapSecure,
        username: values.username,
        password: values.password,
      })
      setTestResult({ ok: result.ok, message: result.ok ? 'Connection successful' : (result.error ?? 'Failed') })
    })
  }

  async function onSubmit(values: AddImapAccountFormValues) {
    await handleSubmit(async () => {
      await addImapAccount(values)
      router.refresh()
      onDone()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input placeholder="Work" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="imapHost"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>IMAP Host</FormLabel>
                <FormControl>
                  <Input placeholder="imap.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imapPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imapSecure"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="mb-0 cursor-pointer">IMAP SSL/TLS</FormLabel>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="smtpHost"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>SMTP Host</FormLabel>
                <FormControl>
                  <Input placeholder="smtp.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="smtpPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="smtpSecure"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="mb-0 cursor-pointer">SMTP SSL/TLS</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Usually your email address" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="App password or account password" {...field} />
              </FormControl>
              <FormDescription>
                Use an app-specific password if your provider supports it (recommended).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="mb-0 cursor-pointer">Set as default account</FormLabel>
            </FormItem>
          )}
        />

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={testPending}>
            {testPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Connection'}
          </Button>
          {testResult && (
            <span className={`flex items-center gap-1.5 text-xs ${testResult.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {testResult.ok
                ? <CheckCircle2 className="h-3.5 w-3.5" />
                : <XCircle className="h-3.5 w-3.5" />}
              {testResult.message}
            </span>
          )}
        </div>

        <FormActions
          saving={saving}
          saved={saved}
          error={error}
          saveLabel="Add Account"
          onCancel={onDone}
        />
      </form>
    </Form>
  )
}

interface EmailFormProps {
  accounts: ImapAccountEntry[]
}

export function EmailForm({ accounts }: EmailFormProps) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium">Email Accounts</p>
        <p className="text-sm text-muted-foreground">
          Connect IMAP/SMTP accounts to read and send email directly from Signals.
        </p>
      </div>

      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map(account => (
            <AccountRow key={account.id} account={account} />
          ))}
        </div>
      )}

      {!showAdd ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Account
        </Button>
      ) : (
        <div className="rounded-lg border border-border p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Add Account</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAdd(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          <AddAccountForm onDone={() => setShowAdd(false)} />
        </div>
      )}
    </div>
  )
}
