'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveFolder } from '@/actions/waypoints'

const folderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type FolderFormValues = z.infer<typeof folderSchema>

interface FolderDrawerProps {
  open: boolean
  onClose: () => void
  folder?: { id: string; name: string } | null
}

export function FolderDrawer({ open, onClose, folder }: FolderDrawerProps) {
  const router = useRouter()
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: folder?.name ?? '' })
    }
  }, [open, folder])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  async function onSubmit(values: FolderFormValues) {
    await handleSubmit(async () => {
      await saveFolder({ id: folder?.id, name: values.name })
      router.refresh()
      form.reset()
      onClose()
    })
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{folder ? 'Edit Folder' : 'New Folder'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form id="folder-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Research" {...field} />
                    </FormControl>
                    <FormMessage />
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
            saveLabel={folder ? 'Save Changes' : 'Add Folder'}
            formId="folder-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}