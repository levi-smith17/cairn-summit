import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/studio/ui/inspector-form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveTrail, deleteTrail } from '@/lib/api/trails'
import { useTerminology } from '@/contexts/terminology-context'
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
import { toast } from 'sonner'

const trailSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type TrailFormValues = z.infer<typeof trailSchema>

interface Trail {
  id: string
  name: string
}

interface TrailFormProps {
  trail: Trail | null
  onBack: () => void
  onSaved: (id: string) => void
  onDeleted: () => void
}

export function TrailForm({ trail, onBack, onSaved, onDeleted }: TrailFormProps) {
  const queryClient = useQueryClient()
  const { terms } = useTerminology()
  const { saving, handleSubmit } = useFormStatus()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const trailSingular = terms.trails.slice(0, -1) || terms.trails

  const form = useForm<TrailFormValues>({
    resolver: zodResolver(trailSchema),
    defaultValues: { name: trail?.name ?? '' },
  })

  async function onSubmit(values: TrailFormValues) {
    await handleSubmit(async () => {
      const result = await saveTrail({ id: trail?.id, name: values.name })
      queryClient.invalidateQueries({ queryKey: ['trails'] })
      onSaved(result.id)
      onBack()
    })
  }

  async function handleDelete() {
    if (!trail) return
    try {
      await deleteTrail(trail.id)
      queryClient.invalidateQueries({ queryKey: ['trails'] })
      onDeleted()
    } catch {
      toast.error('Failed to delete trail. Please try again.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorFormHeader
        title={trail ? `Edit ${trailSingular}` : `New ${trailSingular}`}
        onBack={onBack}
        showBack
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="trail-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

      <InspectorFormActions
        isNew={!trail}
        isSaving={saving}
        formId="trail-form"
        saveLabel="Save changes"
        createLabel={`Add ${trailSingular}`}
        showDelete={!!trail}
        onDelete={() => setDeleteDialogOpen(true)}
        deleteLabel={`Delete ${trailSingular.toLowerCase()}`}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {trailSingular}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{trail?.name}&quot;? All{' '}
              {terms.waypoints.toLowerCase()} in this {trailSingular.toLowerCase()} will be
              unassigned. This cannot be undone.
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
    </div>
  )
}
