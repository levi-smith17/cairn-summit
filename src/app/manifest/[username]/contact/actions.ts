'use server'

import { prisma } from '@/lib/prisma'
import { mailer } from '@/lib/mailer'
import { z } from 'zod'

const schema = z.object({
    senderName: z.string().min(1).max(100),
    senderEmail: z.string().email(),
    body: z.string().min(1).max(2000),
    honeypot: z.string().max(0), // must be empty — bots fill this
})

export async function sendMessage(username: string, formData: FormData) {
    const parsed = schema.safeParse({
        senderName: formData.get('senderName'),
        senderEmail: formData.get('senderEmail'),
        body: formData.get('body'),
        honeypot: formData.get('honeypot') ?? '',
    })

    if (!parsed.success) return { error: 'Invalid submission.' }

    const { senderName, senderEmail, body } = parsed.data

    const wayfarer = await prisma.wayfarer.findUnique({
        where: { username },
        select: { id: true, email: true, name: true },
    })

    if (!wayfarer?.email) return { error: 'Wayfarer not found.' }

    const token = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.message.create({
        data: {
            senderName,
            senderEmail,
            body,
            token,
            tokenExpiresAt,
            wayfarerId: wayfarer.id,
        },
    })

    await mailer.sendMail({
        from: 'noreply@cairn.ing',
        to: wayfarer.email,
        subject: `New message from ${senderName} via Cairn`,
        text: `You have a new message from ${senderName}. View it in your Cairn inbox: https://cairn.ing/messages`,
        html: `
            <p>You have a new message from <strong>${senderName}</strong> on your Cairn manifest.</p>
            <p><a href="https://cairn.ing/messages">View it in your inbox</a></p>
            <p style="color:#888;font-size:12px;">This is an automated notification. Please do not reply to this email.</p>
        `,
    })

    return { success: true }
}
