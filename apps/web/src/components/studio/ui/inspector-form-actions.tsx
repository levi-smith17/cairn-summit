import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InspectorFormActions({
  isNew,
  isSaving,
  canSave = true,
  saveLabel = 'Save changes',
  createLabel = 'Create',
  deleteLabel = 'Delete',
  onSave,
  onDelete,
  showDelete = false,
  formId,
  className,
}: {
  isNew: boolean
  isSaving?: boolean
  canSave?: boolean
  saveLabel?: string
  createLabel?: string
  deleteLabel?: string
  onSave?: () => void
  onDelete?: () => void
  showDelete?: boolean
  /** When set, Save is a submit button for this form id (preferred for inspector forms). */
  formId?: string
  className?: string
}) {
  return (
    <>
      <div className={cn('shrink-0 border-t border-border px-5 py-4', className)}>
        <Button
          type={formId ? 'submit' : 'button'}
          form={formId}
          size="sm"
          className="w-full"
          disabled={!canSave || isSaving}
          onClick={formId ? undefined : onSave}
        >
          {isSaving ? 'Saving…' : isNew ? createLabel : saveLabel}
        </Button>
      </div>
      {!isNew && showDelete && onDelete ? (
        <div className={cn('shrink-0 border-t border-border px-5 py-4', className)}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            {deleteLabel}
          </Button>
        </div>
      ) : null}
    </>
  )
}

export function InspectorFormHeader({
  title,
  onBack,
  showBack = true,
  actions,
}: {
  title: string
  onBack?: () => void
  showBack?: boolean
  actions?: React.ReactNode
}) {
  return (
    <div className="box-border flex h-14 min-h-14 max-h-14 shrink-0 items-center gap-2 border-b border-border px-3">
      {showBack && onBack ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
      {actions}
    </div>
  )
}
