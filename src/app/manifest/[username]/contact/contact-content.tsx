'use client'

import { useActionState } from 'react'
import { sendMessage } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CheckCircle } from 'lucide-react'

interface ContactContentProps {
    username: string
    wayfarerName: string | null
}

export function ContactContent({ username, wayfarerName }: ContactContentProps) {
    const [state, action, pending] = useActionState(
        async (_prev: unknown, formData: FormData) => sendMessage(username, formData),
        null
    )

    if (state?.success) {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle className="h-10 w-10 text-header" />
                <div>
                    <p className="font-medium">Message sent</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {wayfarerName ?? 'They'} will be in touch soon.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <form action={action} className="flex flex-col gap-6">
            {/* Honeypot — hidden from real users, bots fill it */}
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
                    <h2 className="text-lg font-semibold shrink-0">Message</h2>
                    <Separator className="flex-1 bg-header" />
                </div>
                <Textarea
                    id="body"
                    name="body"
                    placeholder={`Write your message to ${wayfarerName ?? 'them'}...`}
                    rows={6}
                    required
                    maxLength={2000}
                />
            </div>

            {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={pending}>
                    {pending ? 'Sending…' : 'Send message'}
                </Button>
            </div>
        </form>
    )
}
