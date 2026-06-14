"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicInvite = getPublicInvite;
exports.acceptInvitation = acceptInvitation;
exports.writeInviteLookup = writeInviteLookup;
exports.deleteInviteLookup = deleteInviteLookup;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("./db");
async function getInvitationByToken(token) {
    const lookup = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
        TableName: db_1.TABLE_NAME,
        Key: { pk: 'INVITE', sk: token },
    }));
    if (!lookup.Item?.invitationId)
        return null;
    const invitation = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
        TableName: db_1.TABLE_NAME,
        Key: { pk: 'ADMIN', sk: `INVITATION#${lookup.Item.invitationId}` },
    }));
    return invitation.Item ?? null;
}
async function getPublicInvite(token) {
    const invitation = await getInvitationByToken(token);
    if (!invitation)
        return null;
    return {
        email: invitation.email,
        note: invitation.note ?? null,
        expiresAt: invitation.expiresAt,
        usedAt: invitation.usedAt ?? null,
        invitedBy: {
            name: invitation.invitedByName ?? null,
            email: invitation.invitedByEmail ?? null,
        },
    };
}
async function acceptInvitation(token, email) {
    const invitation = await getInvitationByToken(token);
    if (!invitation)
        return { ok: false, status: 404 };
    if (invitation.usedAt)
        return { ok: false, status: 409 };
    if (new Date() > new Date(invitation.expiresAt)) {
        return { ok: false, status: 410 };
    }
    const invitedEmail = String(invitation.email).trim().toLowerCase();
    const signupEmail = email.trim().toLowerCase();
    if (invitedEmail !== signupEmail)
        return { ok: false, status: 400 };
    const now = new Date().toISOString();
    await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
        TableName: db_1.TABLE_NAME,
        Key: { pk: 'ADMIN', sk: `INVITATION#${invitation.id}` },
        UpdateExpression: 'SET usedAt = :usedAt',
        ExpressionAttributeValues: { ':usedAt': now },
    }));
    return { ok: true };
}
async function writeInviteLookup(token, invitationId) {
    await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
        TableName: db_1.TABLE_NAME,
        Item: {
            pk: 'INVITE',
            sk: token,
            invitationId,
        },
    }));
}
async function deleteInviteLookup(token) {
    await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
        TableName: db_1.TABLE_NAME,
        Key: { pk: 'INVITE', sk: token },
    }));
}
//# sourceMappingURL=invites.js.map