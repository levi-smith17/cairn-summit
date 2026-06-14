import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { randomUUID } from 'crypto'
import { dynamo, TABLE_NAME } from './db'

const ses = new SESv2Client({})
const TOKEN_TTL_DAYS = 7

export interface CreateContactSignalInput {
    username: string
    senderName: string
    senderEmail: string
    body: string
}

export interface CreateContactSignalResult {
    id: string
    token: string
    threadUrl: string
}

export async function createContactSignal(
    input: CreateContactSignalInput
): Promise<CreateContactSignalResult | null> {
    const scan = await dynamo.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'sk = :sk AND username = :username',
        ExpressionAttributeValues: {
            ':sk': 'PROFILE',
            ':username': input.username,
        },
    }))

    const profile = scan.Items?.[0]
    if (!profile) return null

    const userPk = profile.pk as string
    const wayfarerEmail = profile.email as string | undefined
    const id = randomUUID()
    const sk = `SIGNAL#${id}`
    const token = randomUUID()
    const now = new Date().toISOString()
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const webUrl = (process.env.WEB_URL ?? '').replace(/\/$/, '')
    const threadUrl = `${webUrl}/thread/${token}`

    const signal = {
        pk: userPk,
        sk,
        senderName: input.senderName,
        senderEmail: input.senderEmail,
        body: input.body,
        read: false,
        token,
        tokenExpiresAt,
        createdAt: now,
    }

    await Promise.all([
        dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: signal })),
        dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: 'TOKEN',
                sk: token,
                userPk,
                signalId: id,
                tokenExpiresAt,
            },
        })),
    ])

    if (wayfarerEmail && process.env.SES_FROM_EMAIL) {
        await ses.send(new SendEmailCommand({
            FromEmailAddress: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [wayfarerEmail] },
            ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
            Content: {
                Simple: {
                    Subject: { Data: 'New message on Cairn', Charset: 'UTF-8' },
                    Body: {
                        Text: {
                            Data: [
                                `You have a new message from ${input.senderName} (${input.senderEmail}):`,
                                '',
                                input.body,
                                '',
                                `View and reply in Cairn: ${webUrl}/signals`,
                                `Visitor thread link: ${threadUrl}`,
                            ].join('\n'),
                            Charset: 'UTF-8',
                        },
                    },
                },
            },
        }))
    }

    return { id, token, threadUrl }
}
