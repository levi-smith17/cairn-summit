import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Folder, Trash2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/forms/form-actions'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const trailSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type TrailFormValues = z.infer<typeof trailSchema>

interface Trail {
  id: string
  name: string
  _count: { waypoints: number }
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
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setDeleting(true)
    await deleteTrail(trail.id)
    queryClient.invalidateQueries({ queryKey: ['trails'] })
    onDeleted()
  }

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
            {trail ? `Edit ${terms.trails.slice(0, -1)}` : `New ${terms.trails.slice(0, -1)}`}
          </span>
        </div>
        {trail && (
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
            <TooltipContent>Remove {terms.trails.slice(0, -1).toLowerCase()}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
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

            {trail && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  Contains {trail._count.waypoints} {trail._count.waypoints !== 1 ? terms.waypoints.toLowerCase() : terms.waypoints.slice(0, -1).toLowerCase()}
                </p>
              </div>
            )}

            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={trail ? 'Save Changes' : `Add ${terms.trails.slice(0, -1)}`}
              formId="trail-form"
              onCancel={onBack}
            />
          </form>
        </Form>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {terms.trails.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{trail?.name}&quot;? All {terms.waypoints.toLowerCase()} in this{' '}
              {terms.trails.slice(0, -1).toLowerCase()} will be unassigned. This cannot be undone.
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
