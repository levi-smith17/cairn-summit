'use server'

import { prisma } from '@/lib/prisma'
import { mailer } from '@/lib/mailer'

export async function sendThreadReply(token: string, html: string) {
    const trimmed = html.replace(/<[^>]+>/g, '').trim()
    if (!trimmed) return { error: 'Message cannot be empty.' }

    const message = await prisma.signal.findUnique({
        where: { token },
        select: {
            id: true,
            senderName: true,
            senderEmail: true,
            tokenExpiresAt: true,
            wayfarer: { select: { email: true, name: true } },
        },
    })

    if (!message) return { error: 'Thread not found.' }
    if (!message.tokenExpiresAt || message.tokenExpiresAt < new Date()) {
        return { error: 'This conversation link has expired. Please use the contact form to send a new message.' }
    }

    await prisma.signalReply.create({
        data: {
            signalId: message.id,
            body: html,
            direction: 'INBOUND',
            senderName: message.senderName,
            senderEmail: message.senderEmail,
        },
    })

    if (message.wayfarer.email) {
        await mailer.sendMail({
            from: 'noreply@cairn.ing',
            to: message.wayfarer.email,
            subject: `New reply from ${message.senderName} via Cairn`,
            html: `
                <p><strong>${message.senderName}</strong> replied to your message.</p>
                <p><a href="https://cairn.ing/messages">View it in your inbox</a></p>
                <p style="color:#888;font-size:12px;">This is an automated notification. Please do not reply to this email.</p>
            `,
            text: `${message.senderName} replied to your message. View it in your inbox: https://cairn.ing/messages`,
        })
    }

    return { success: true }
}
