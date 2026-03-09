'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saveManifestSettings } from '@/actions/manifest'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const settingsSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-z0-9-_]+$/, 'Username can only contain lowercase letters, numbers, hyphens and underscores')
        .optional()
        .or(z.literal('')),
    defaultTerminology: z.enum(['CAIRN', 'STANDARD']),
    defaultTheme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
    listed: z.boolean(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface SettingsFormProps {
    defaultValues: {
        username: string | null
        defaultTerminology: 'CAIRN' | 'STANDARD'
        defaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
        listed: boolean
    }
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
    const { saving, saved, error, handleSubmit } = useFormStatus()

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            username: defaultValues.username ?? '',
            defaultTerminology: defaultValues.defaultTerminology,
            defaultTheme: defaultValues.defaultTheme,
            listed: defaultValues.listed,
        },
    })

    async function onSubmit(values: SettingsFormValues) {
        await handleSubmit(() => saveManifestSettings({
            username: values.username || null,
            defaultTerminology: values.defaultTerminology,
            defaultTheme: values.defaultTheme,
            listed: values.listed
        }))
    }

    const username = form.watch('username')

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. levi"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                {username
                                    ? <>Your Manifest is available at{' '}
                                        <a
                                            href={`/manifest/${username}`}
                                            target="_self"
                                            rel="noopener noreferrer"
                                            className="underline underline-offset-4 hover:text-foreground"
                                        >
                                            /manifest/{username}
                                        </a>
                                    </>
                                    : 'Choose a unique username for your public manifest URL'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="listed"
                    render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="flex flex-col gap-1">
                                <FormLabel>List me in the Wayfarer Directory</FormLabel>
                                <FormDescription>
                                    When enabled your Manifest will appear in the public directory on the homepage.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="defaultTerminology"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Default Terminology</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="CAIRN">Cairn (Origins, Expeditions, etc.)</SelectItem>
                                    <SelectItem value="STANDARD">Standard (Bio, Work Experience, etc.)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                This sets the default section labels on your public Manifest. Visitors can toggle between both.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="defaultTheme"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Default Theme for Visitors</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="SYSTEM">System (follows visitor's preference)</SelectItem>
                                    <SelectItem value="LIGHT">Light</SelectItem>
                                    <SelectItem value="DARK">Dark</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Sets the default theme when visitors view your public Manifest page.
                                Visitors can still toggle it themselves.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormActions
                    saving={saving}
                    saved={saved}
                    error={error}
                    saveLabel="Save Settings"
                />
            </form>
        </Form >
    )
}