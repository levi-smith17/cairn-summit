'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveGear, deleteGear } from '@/actions/manifest'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const gearLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const
type GearLevel = typeof gearLevels[number]

const gearSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional(),
  level: z.enum(gearLevels).optional(),
})

type GearFormValues = z.infer<typeof gearSchema>

interface Gear {
  id: string
  name: string
  category: string | null
  level: GearLevel | null
}

interface GearFormProps {
  gear: Gear[]
}

const emptyDefaults: GearFormValues = {
  name: '',
  category: '',
  level: undefined,
}

const levelLabels: Record<GearLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
}

export function GearForm({ gear }: GearFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const form = useForm<GearFormValues>({
    resolver: zodResolver(gearSchema),
    defaultValues: emptyDefaults,
  })

  function startAdd() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(true)
  }

  function startEdit(entry: Gear) {
    form.reset({
      id: entry.id,
      name: entry.name,
      category: entry.category ?? '',
      level: entry.level ?? undefined,
    })
    setAdding(false)
    setEditing(entry.id)
  }

  function cancel() {
    form.reset(emptyDefaults)
    setEditing(null)
    setAdding(false)
  }

  async function onSubmit(values: GearFormValues) {
    await handleSubmit(() => saveGear({
      id: values.id,
      name: values.name,
      category: values.category ?? null,
      level: values.level ?? null,
    }))
    cancel()
  }

  async function onDelete(id: string) {
    await deleteGear(id)
  }

  // Group gear by category for display
  const grouped = gear.reduce<Record<string, Gear[]>>((acc, item) => {
    const key = item.category ?? 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Existing entries grouped by category */}
      {gear.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                  >
                    <span>{item.name}</span>
                    {item.level && (
                      <span className="text-muted-foreground text-xs">
                        · {levelLabels[item.level]}
                      </span>
                    )}
                    <button
                      onClick={() => startEdit(item)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {(adding || editing) && (
        <>
          {gear.length > 0 && <Separator />}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. TypeScript" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Programming" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gearLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {levelLabels[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end items-center gap-4">
                <Button type="button" variant="ghost" onClick={cancel}>
                  Cancel
                </Button>
                <FormActions
                  saving={saving}
                  saved={saved}
                  error={error}
                  saveLabel={editing ? 'Update Gear' : 'Add Gear'}
                />
              </div>
            </form>
          </Form>
        </>
      )}

      {/* Add button */}
      {!adding && !editing && (
        <Button variant="outline" onClick={startAdd}>
          <Plus className="h-4 w-4" />
          Add Gear
        </Button>
      )}
    </div>
  )
}