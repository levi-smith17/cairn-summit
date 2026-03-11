'use client'

import { useActionState } from 'react'
import { sendPrivacyRequest } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CheckCircle } from 'lucide-react'

const REQUEST_TYPES = ['Data Access', 'Data Deletion', 'Data Correction', 'Opt-Out', 'Other'] as const

export function PrivacyContactForm() {
    const [state, action, pending] = useActionState(
        async (_prev: unknown, formData: FormData) => sendPrivacyRequest(formData),
        null
    )

    if (state?.success) {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle className="h-10 w-10 text-header" />
                <div>
                    <p className="font-medium">Request received</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        We'll respond to your privacy request within 30 days.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <form action={action} className="flex flex-col gap-6">
            {/* Honeypot */}
            <input name="honeypot" type="text" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold shrink-0">Your details</h2>
                    <Separator className="flex-1 bg-header" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="senderName">Name</Label>
                        <Input id="senderName" name="senderName" placeholder="Your name" required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="senderEmail">Email</Label>
                        <Input id="senderEmail" name="senderEmail" type="email" placeholder="your@email.com" required />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold shrink-0">Request</h2>
                    <Separator className="flex-1 bg-header" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="requestType">Request type</Label>
                    <Select name="requestType" required>
                        <SelectTrigger id="requestType" className="w-full">
                            <SelectValue placeholder="Select a request type" />
                        </SelectTrigger>
                        <SelectContent>
                            {REQUEST_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="message">Details</Label>
                    <Textarea
                        id="message"
                        name="message"
                        placeholder="Describe your request..."
                        rows={6}
                        required
                        maxLength={2000}
                    />
                </div>
            </div>

            {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={pending}>
                    {pending ? 'Sending…' : 'Submit request'}
                </Button>
            </div>
        </form>
    )
}
