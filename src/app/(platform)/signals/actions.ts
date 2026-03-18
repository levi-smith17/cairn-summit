'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { mailer } from '@/lib/mailer'
import { revalidatePath } from 'next/cache'

export async function markMessageRead(messageId: string) {
    const session = await auth()
    if (!session?.user?.id) return

    await prisma.signal.updateMany({
        where: { id: messageId, wayfarerId: session.user.id },
        data: { read: true },
    })

    revalidatePath('/signals')
}

export async function deleteMessage(messageId: string) {
    const session = await auth()
    if (!session?.user?.id) return

    await prisma.signal.deleteMany({
        where: { id: messageId, wayfarerId: session.user.id },
    })

    revalidatePath('/signals')
}

export async function sendReply(messageId: string, html: string) {
    const session = await auth()
    if (!session?.user?.id) return

    const message = await prisma.signal.findFirst({
        where: { id: messageId, wayfarerId: session.user.id },
        select: { senderName: true, senderEmail: true, token: true },
    })

    if (!message) return

    await prisma.signalReply.create({
        data: { signalId: messageId, body: html, direction: 'OUTBOUND' },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? ''
    const threadUrl = message.token ? `${baseUrl}/thread/${message.token}` : null

    await mailer.sendMail({
        from: 'noreply@cairn.ing',
        to: message.senderEmail,
        subject: `Re: Your message via Cairn`,
        html: `
            <p>Hi ${message.senderName},</p>
            <p>You received a reply to your message:</p>
            <hr />
            ${html}
            <hr />
            ${threadUrl ? `<p><a href="${threadUrl}">Continue this conversation on Cairn</a> — link valid for 30 days from your original message.</p>` : ''}
            <p style="color:#888;font-size:12px;">This is an automated notification. Please do not reply to this email.</p>
        `,
        text: html.replace(/<[^>]+>/g, '') + (threadUrl ? `\n\nContinue this conversation: ${threadUrl}` : ''),
    })

    revalidatePath('/signals')
}
