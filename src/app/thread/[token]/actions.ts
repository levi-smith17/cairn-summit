'use server'

import { prisma } from '@/lib/prisma'
import { mailer } from '@/lib/mailer'

export async function sendThreadReply(token: string, html: string) {
    const trimmed = html.replace(/<[^>]+>/g, '').trim()
    if (!trimmed) return { error: 'Message cannot be empty.' }

    const message = await prisma.message.findUnique({
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

    await prisma.messageReply.create({
        data: {
            messageId: message.id,
            body: html,
            direction: 'INBOUND',
            senderName: message.senderName,
            senderEmail: message.senderEmail,
        },
    })

    if (message.wayfarer.email) {
        const baseUrl = process.env.NEXTAUTH_URL ?? ''
        await mailer.sendMail({
            from: process.env.EMAIL_SERVER_USER,
            to: message.wayfarer.email,
            subject: `New reply from ${message.senderName} via Cairn`,
            html: `
                <p>${message.senderName} replied to your message:</p>
                <hr />
                ${html}
                <hr />
                <p><a href="${baseUrl}/messages">View in your Cairn inbox</a></p>
            `,
            text: trimmed + `\n\nView in your inbox: ${baseUrl}/messages`,
            replyTo: message.senderEmail,
        })
    }

    return { success: true }
}
