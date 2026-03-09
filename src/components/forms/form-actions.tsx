'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react'

interface FormActionsProps {
  saving: boolean
  saved: boolean
  error: boolean
  saveLabel?: string
  formId?: string
}

export function FormActions({
  saving,
  saved,
  error,
  saveLabel = 'Save',
  formId,
}: FormActionsProps) {
  return (
    <div className="flex justify-end items-center gap-4">
      {saved && (
        <Alert className="bg-success border-success py-2 flex-1">
          <CheckCircle2 className="h-4 w-4" color="var(--color-success-foreground)" />
          <AlertDescription className="text-success-foreground">
            Saved successfully.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="bg-error border-error py-2 flex-1">
          <AlertCircle className="h-4 w-4" color="var(--color-error-foreground)" />
          <AlertDescription className="text-error-foreground">
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>
      )}
      <Button 
        type="submit" 
        form={formId}
        disabled={saving}
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