'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveSession } from '@/actions/doordash'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  gasPrice: z.string().min(1, 'Gas price is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  mpg: z.string().min(1, 'MPG is required').refine(v => parseFloat(v) > 0, 'Must be a positive number'),
  startOdometer: z.string().optional(),
  endOdometer: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString().slice(0, 10)
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().slice(0, 10)
}

function toOdoStr(v: number | null | undefined): string {
  return v != null ? String(v) : ''
}

interface SessionFormProps {
  session?: any
  onDone: () => void
}

export function SessionForm({ session, onDone }: SessionFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: toDateInput(session?.date),
      gasPrice: session ? String(parseFloat(String(session.gasPrice))) : '',
      mpg: session ? String(parseFloat(String(session.mpg))) : '',
      startOdometer: toOdoStr(session?.startOdometer),
      endOdometer: toOdoStr(session?.endOdometer),
      notes: session?.notes ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveSession({
        id: session?.id,
        date: new Date(values.date + 'T12:00:00'),
        gasPrice: parseFloat(values.gasPrice),
        mpg: parseFloat(values.mpg),
        startOdometer: values.startOdometer ? parseFloat(values.startOdometer) : null,
        endOdometer: values.endOdometer ? parseFloat(values.endOdometer) : null,
        notes: values.notes || null,
      })
      onDone()
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium">{session ? 'Edit Session' : 'New Session'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form id="session-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gasPrice" render={({ field }) => (
              <FormItem>
                <FormLabel>Gas Price ($/gal)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.001" placeholder="3.459" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="mpg" render={({ field }) => (
              <FormItem>
                <FormLabel>MPG</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="32.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Odometer — optional, recorded at start and end of session */}
            <div className="space-y-3">
              <p className="text-sm font-medium leading-none">
                Odometer <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="startOdometer" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Start</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="45231.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endOdometer" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">End</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="45298.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Saturday morning shift" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="-mx-4 border-t" />
            <FormActions
              saving={saving}
              saved={saved}
              error={error}
              saveLabel={session ? 'Save Changes' : 'Start Session'}
              formId="session-form"
              onCancel={onDone}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}
