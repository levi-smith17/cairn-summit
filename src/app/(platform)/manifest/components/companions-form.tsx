'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveCompanion } from '@/actions/manifest'
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
import { Checkbox } from '@/components/ui/checkbox'
import { CompanionCard } from './companion-card'
import { FormActions } from '@/components/forms/form-actions'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

const companionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  birthday: z.string().optional(),
  bio: z.string().optional(),
  passed: z.boolean(),
})

type CompanionFormValues = z.infer<typeof companionSchema>

interface CompanionMedia {
  id: string
  key: string
  type: 'IMAGE' | 'VIDEO'
  caption?: string | null
  order: number
}

interface Companion {
  id: string
  name: string
  species: string
  breed?: string | null
  birthday?: Date | null
  bio?: string | null
  passed?: boolean
  media: CompanionMedia[]
}

interface CompanionsFormProps {
  companions: Companion[]
  adding: boolean
  setAdding: (v: boolean) => void
  saving: boolean
  saved: boolean
  error: boolean
  handleSubmit: (action: () => Promise<void>) => Promise<void>
}

export function CompanionsForm({ companions: initialCompanions, adding, setAdding, saving, saved, error, handleSubmit }: CompanionsFormProps) {
  const [companions, setCompanions] = useState(initialCompanions)

  const form = useForm<CompanionFormValues>({
    resolver: zodResolver(companionSchema),
    defaultValues: {
      name: '',
      species: '',
      breed: '',
      birthday: undefined,
      bio: '',
      passed: false,
    },
  })

  async function onSubmit(values: CompanionFormValues) {
    await handleSubmit(async () => {
      await saveCompanion({
        name: values.name,
        species: values.species,
        breed: values.breed || null,
        birthday: values.birthday ? new Date(values.birthday) : null,
        bio: values.bio || null,
        passed: values.passed
      })
      form.reset()
      setAdding(false)
      await refreshCompanions()
    })
  }

  async function refreshCompanions() {
    const res = await fetch('/api/companions')
    const data = await res.json()
    setCompanions(data.companions)
  }

  return (
    <div className="space-y-6">
      {adding && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-secondary p-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Buddy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <FormControl>
                      <Input placeholder="Dog, Cat..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passed"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">In memoriam</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (optional)</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Tell their story..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              <FormActions
                saving={saving}
                saved={saved}
                error={error}
                saveLabel="Add Companion"
                hideAlert
              />
            </div>
          </form>
        </Form>
      )}
      
      {companions.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No companions added yet.</p>
      )}

      {companions.map((companion) => (
        <CompanionCard
          key={companion.id}
          companion={companion}
          onRefresh={refreshCompanions}
        />
      ))}
    </div>
  )
}
