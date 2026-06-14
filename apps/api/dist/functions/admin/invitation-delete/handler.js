"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const invites_1 = require("../../shared/invites");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const targetId = (0, auth_1.getPathId)(event);
        if (!targetId)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('id is required'));
        const profileRes = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
        }));
        if (!profileRes.Item?.isAdmin)
            return (0, response_1.toApiGatewayResponse)((0, response_1.forbidden)('Admin access required'));
        const invitationRes = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'ADMIN', sk: `INVITATION#${targetId}` },
        }));
        await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'ADMIN', sk: `INVITATION#${targetId}` },
        }));
        if (invitationRes.Item?.token) {
            await (0, invites_1.deleteInviteLookup)(invitationRes.Item.token);
        }
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map