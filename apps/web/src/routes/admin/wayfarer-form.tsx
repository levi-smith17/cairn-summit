import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Trash2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { saveWayfarer, deleteWayfarer } from '@/lib/api/admin'
import type { WayfarerSummary } from '@/lib/api/admin'

const schema = z.object({
  name:         z.string().optional(),
  email:        z.string().email('Must be a valid email'),
  username:     z.string().optional(),
  customDomain: z.string().optional(),
  isAdmin:      z.boolean(),
  listed:       z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface WayfarerFormProps {
  wayfarer: WayfarerSummary | null
  currentUserId: string
  onBack: () => void
  onSaved: (id: string) => void
  onDeleted: () => void
  onRefresh: () => void
}

export function WayfarerForm({
  wayfarer,
  currentUserId,
  onBack,
  onSaved,
  onDeleted,
  onRefresh,
}: WayfarerFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         wayfarer?.name ?? '',
      email:        wayfarer?.email ?? '',
      username:     wayfarer?.username ?? '',
      customDomain: wayfarer?.customDomain ?? '',
      isAdmin:      wayfarer?.isAdmin ?? false,
      listed:       wayfarer?.listed ?? true,
    },
  })

  useEffect(() => {
    form.reset({
      name:         wayfarer?.name ?? '',
      email:        wayfarer?.email ?? '',
      username:     wayfarer?.username ?? '',
      customDomain: wayfarer?.customDomain ?? '',
      isAdmin:      wayfarer?.isAdmin ?? false,
      listed:       wayfarer?.listed ?? true,
    })
  }, [wayfarer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const result = await saveWayfarer({
        id:           wayfarer?.id,
        name:         values.name || null,
        email:        values.email,
        username:     values.username || null,
        customDomain: values.customDomain || null,
        isAdmin:      values.isAdmin,
        listed:       values.listed,
      })
      if (!result.ok) throw new Error(result.error)
      onRefresh()
      onSaved(result.id!)
    })
  }

  function handleDelete() {
    if (!wayfarer) return
    startDelete(async () => {
      const result = await deleteWayfarer(wayfarer.id)
      setDeleteDialogOpen(false)
      if (!result.ok) return
      onRefresh()
      onDeleted()
    })
  }

  const isSelf = wayfarer?.id === currentUserId

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {wayfarer ? 'Edit Wayfarer' : 'Add Wayfarer'}
          </span>
        </div>
        {wayfarer && !isSelf && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive/80"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete wayfarer</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="wayfarer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">General</p>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormDescription>Used for the public manifest URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</p>

              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Admin</FormLabel>
                      <FormDescription className="text-xs">
                        Full access to the admin panel and all platform features.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSelf}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listed"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Listed</FormLabel>
                      <FormDescription className="text-xs">
                        Show this wayfarer in public directories.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={wayfarer ? 'Save Changes' : 'Add Wayfarer'}
              formId="wayfarer-form"
              onCancel={onBack}
            />
          </form>
        </Form>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wayfarer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{wayfarer?.name ?? wayfarer?.email}</strong>?
              This will permanently remove their account and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
