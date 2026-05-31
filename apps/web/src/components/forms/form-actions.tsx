'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react'

interface FormAlertProps {
  saved: boolean
  error: boolean
}

export function FormAlert({ saved, error }: FormAlertProps) {
  if (!saved && !error) return null
  return (
    <>
      {saved && (
        <Alert className="bg-success border-success py-1">
          <CheckCircle2 className="h-4 w-4" color="var(--color-success-foreground)" />
          <AlertDescription className="text-success-foreground">
            Saved successfully.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="bg-error border-error py-1">
          <AlertCircle className="h-4 w-4" color="var(--color-error-foreground)" />
          <AlertDescription className="text-error-foreground">
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

interface FormActionsProps {
  saving: boolean
  saved: boolean
  error: boolean
  saveLabel?: string
  formId?: string
  hideAlert?: boolean
  onCancel?: () => void
  buttonClassName?: string
}

export function FormActions({
  saving,
  saved,
  error,
  saveLabel = 'Save',
  formId,
  hideAlert = false,
  onCancel,
  buttonClassName,
}: FormActionsProps) {
  return (
    <div className="flex flex-col md:flex-row flex-col-reverse justify-end items-center gap-4 w-full md:w-auto">
      {!hideAlert && saved && (
        <Alert className="bg-success border-success py-2 flex-1 w-full md:w-auto">
          <CheckCircle2 className="h-4 w-4" color="var(--color-success-foreground)" />
          <AlertDescription className="text-success-foreground">
            Saved successfully.
          </AlertDescription>
        </Alert>
      )}
      {!hideAlert && error && (
        <Alert className="bg-error border-error py-2 flex-1 w-full md:w-auto">
          <AlertCircle className="h-4 w-4" color="var(--color-error-foreground)" />
          <AlertDescription className="text-error-foreground">
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>
      )}
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel} className={`w-full md:w-auto ${buttonClassName ?? ''}`}>
          Cancel
        </Button>
      )}
      <Button
        type="submit"
        form={formId}
        disabled={saving}
        className={`w-full md:w-auto ${buttonClassName ?? ''}`}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? 'Saving...' : saveLabel}
      </Button>
    </div>
  )
}