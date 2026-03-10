'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { savePathfinding, deletePathfinding } from '@/actions/manifest'
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
import { EntryActions } from './entry-actions'
import { FormActions } from '@/components/forms/form-actions'
import { MonthYearPicker } from '@/components/ui/month-year-picker'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { RichTextContent } from '@/components/ui/rich-text-content'

const pathfindingSchema = z.object({
    id: z.string().optional(),
    organization: z.string().min(1, 'Organization is required'),
    role: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    current: z.boolean(),
    description: z.string().optional(),
})

type PathfindingFormValues = z.infer<typeof pathfindingSchema>

interface Pathfinding {
    id: string
    organization: string
    role: string | null
    location: string | null
    startDate: Date
    endDate: Date | null
    current: boolean
    description: string | null
}

interface PathfindingFormProps {
    pathfinding: Pathfinding[]
    adding: boolean
    setAdding: (v: boolean) => void
    saving: boolean
    saved: boolean
    error: boolean
    handleSubmit: (action: () => Promise<void>) => Promise<void>
}

const emptyDefaults: PathfindingFormValues = {
    organization: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
}

export function PathfindingForm({ pathfinding, adding, setAdding, saving, saved, error, handleSubmit }: PathfindingFormProps) {
    const [editing, setEditing] = useState<string | null>(null)

    const form = useForm<PathfindingFormValues>({
        resolver: zodResolver(pathfindingSchema),
        defaultValues: emptyDefaults,
    })

    const current = form.watch('current')

    function startEdit(entry: Pathfinding) {
        form.reset({
            id: entry.id,
            organization: entry.organization,
            role: entry.role ?? '',
            location: entry.location ?? '',
            startDate: entry.startDate.toISOString().split('T')[0],
            endDate: entry.endDate?.toISOString().split('T')[0] ?? '',
            current: entry.current,
            description: entry.description ?? '',
        })
        setAdding(false)
        setEditing(entry.id)
    }

    function cancel() {
        form.reset(emptyDefaults)
        setEditing(null)
        setAdding(false)
    }

    async function onSubmit(values: PathfindingFormValues) {
        await handleSubmit(async () => {
            await savePathfinding({
                id: values.id,
                organization: values.organization,
                role: values.role ?? null,
                location: values.location ?? null,
                startDate: new Date(values.startDate),
                endDate: values.current ? null : values.endDate ? new Date(values.endDate) : null,
                current: values.current,
                description: values.description ?? null,
            })
            cancel()
        })
    }

    async function onDelete(id: string) {
        await deletePathfinding(id)
    }

    function renderForm() {
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border bg-secondary p-4 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="organization"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Red Cross" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Volunteer Coordinator" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. San Francisco, CA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Select start date" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {!current && (
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <MonthYearPicker value={field.value} onChange={field.onChange} placeholder="Select end date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <FormField
                        control={form.control}
                        name="current"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel>I currently volunteer here</FormLabel>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Describe your contributions and impact..." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end items-center gap-4">
                        <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
                        <FormActions saving={saving} saved={saved} error={error} saveLabel={editing ? 'Update Pathfinding' : 'Add Pathfinding'} hideAlert />
                    </div>
                </form>
            </Form>
        )
    }

    return (
        <div className="space-y-6">
            {adding && renderForm()}

            {pathfinding.length > 0 && (
                <div className="space-y-4">
                    {pathfinding.map((entry) => (
                        editing === entry.id ? (
                            <div key={entry.id} className="rounded-lg border p-4">
                                {renderForm()}
                            </div>
                        ) : (
                            <div key={entry.id} className="rounded-lg border p-4 space-y-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{entry.organization}</p>
                                        {entry.role && <p className="text-sm text-muted-foreground">{entry.role}</p>}
                                        {entry.location && <p className="text-sm text-muted-foreground">{entry.location}</p>}
                                        <p className="text-sm text-muted-foreground">
                                            {entry.startDate.toLocaleDateString()} —{' '}
                                            {entry.current ? 'Present' : entry.endDate?.toLocaleDateString()}
                                        </p>
                                        {entry.description && <RichTextContent html={entry.description} className="text-muted-foreground" />}
                                    </div>
                                    <EntryActions
                                        onEdit={() => startEdit(entry)}
                                        onDelete={() => onDelete(entry.id)}
                                        deleteTitle="Remove Pathfinding"
                                        itemName={entry.organization}
                                    />
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
