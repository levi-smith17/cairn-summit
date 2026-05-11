import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export type RecurrenceScope = 'one' | 'future' | 'all'

interface RecurrenceDialogProps {
  open: boolean
  mode: 'edit' | 'delete'
  onSelect: (scope: RecurrenceScope) => void
  onCancel: () => void
}

export function RecurrenceDialog({ open, mode, onSelect, onCancel }: RecurrenceDialogProps) {
  const verb = mode === 'edit' ? 'edit' : 'delete'
  const Verb = mode === 'edit' ? 'Edit' : 'Delete'

  return (
    <AlertDialog open={open} onOpenChange={o => { if (!o) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{Verb} recurring event</AlertDialogTitle>
          <AlertDialogDescription>
            Which events would you like to {verb}?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Button variant="outline" className="justify-start" onClick={() => onSelect('one')}>
            This event
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => onSelect('future')}>
            This and following events
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => onSelect('all')}>
            All events
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
