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

    const baseUrl = process.env.NEXTAUTH_URL ?? ''
    const threadUrl = `${baseUrl}/thread/${token}`

    await mailer.sendMail({
        from: process.env.EMAIL_SERVER_USER,
        to: wayfarer.email,
        subject: `New message from ${senderName} via Cairn`,
        text: `You have a new message from ${senderName} (${senderEmail}):\n\n${body}\n\nReply at: ${threadUrl}`,
        html: `
            <p>You have a new message on your Cairn manifest.</p>
            <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
            <hr />
            <p>${body.replace(/\n/g, '<br />')}</p>
            <hr />
            <p style="color:#888;font-size:12px;">Reply directly to this email to respond.</p>
        `,
        replyTo: senderEmail,
    })

    return { success: true }
}
