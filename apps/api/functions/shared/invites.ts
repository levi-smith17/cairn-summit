import { GetCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from './db'

async function getInvitationByToken(token: string) {
    const lookup = await dynamo.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'INVITE', sk: token },
    }))
    if (!lookup.Item?.invitationId) return null

    const invitation = await dynamo.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'ADMIN', sk: `INVITATION#${lookup.Item.invitationId}` },
    }))
    return invitation.Item ?? null
}

export async function getPublicInvite(token: string) {
    const invitation = await getInvitationByToken(token)
    if (!invitation) return null

    return {
        email: invitation.email as string,
        note: (invitation.note as string | null) ?? null,
        expiresAt: invitation.expiresAt as string,
        usedAt: (invitation.usedAt as string | null) ?? null,
        invitedBy: {
            name: (invitation.invitedByName as string | null) ?? null,
            email: (invitation.invitedByEmail as string | null) ?? null,
        },
    }
}

export async function acceptInvitation(token: string, email: string) {
    const invitation = await getInvitationByToken(token)
    if (!invitation) return { ok: false as const, status: 404 as const }

    if (invitation.usedAt) return { ok: false as const, status: 409 as const }
    if (new Date() > new Date(invitation.expiresAt as string)) {
        return { ok: false as const, status: 410 as const }
    }

    const invitedEmail = String(invitation.email).trim().toLowerCase()
    const signupEmail = email.trim().toLowerCase()
    if (invitedEmail !== signupEmail) return { ok: false as const, status: 400 as const }

    const now = new Date().toISOString()
    await dynamo.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'ADMIN', sk: `INVITATION#${invitation.id}` },
        UpdateExpression: 'SET usedAt = :usedAt',
        ExpressionAttributeValues: { ':usedAt': now },
    }))

    return { ok: true as const }
}

export async function writeInviteLookup(token: string, invitationId: string) {
    await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            pk: 'INVITE',
            sk: token,
            invitationId,
        },
    }))
}

export async function deleteInviteLookup(token: string) {
    await dynamo.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'INVITE', sk: token },
    }))
}
