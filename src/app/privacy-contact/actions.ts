'use server'

import { mailer } from '@/lib/mailer'
import { z } from 'zod'

const schema = z.object({
    senderName: z.string().min(1).max(100),
    senderEmail: z.string().email(),
    requestType: z.enum(['Data Access', 'Data Deletion', 'Data Correction', 'Opt-Out', 'Other']),
    message: z.string().min(1).max(2000),
    honeypot: z.string().max(0),
})

export async function sendPrivacyRequest(formData: FormData) {
    const parsed = schema.safeParse({
        senderName: formData.get('senderName'),
        senderEmail: formData.get('senderEmail'),
        requestType: formData.get('requestType'),
        message: formData.get('message'),
        honeypot: formData.get('honeypot') ?? '',
    })

    if (!parsed.success) return { error: 'Invalid submission.' }

    const { senderName, senderEmail, requestType, message } = parsed.data

    await mailer.sendMail({
        from: 'noreply@cairn.ing',
        to: 'privacy@cairn.ing',
        replyTo: senderEmail,
        subject: `Privacy Request: ${requestType} from ${senderName}`,
        text: `Name: ${senderName}\nEmail: ${senderEmail}\nRequest Type: ${requestType}\n\n${message}`,
        html: `
            <p><strong>Name:</strong> ${senderName}</p>
            <p><strong>Email:</strong> ${senderEmail}</p>
            <p><strong>Request Type:</strong> ${requestType}</p>
            <hr />
            <p>${message.replace(/\n/g, '<br />')}</p>
        `,
    })

    return { success: true }
}
