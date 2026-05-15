"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const ssm = new client_ssm_1.SSMClient({ region: process.env.AWS_REGION });
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name || !body.appleId || !body.password) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name, appleId, and password are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const userId = (0, auth_1.getUserId)(event);
        const id = (0, crypto_1.randomUUID)();
        const sk = `ITINERARY#${id}`;
        const now = new Date().toISOString();
        const ssmPasswordPath = `/cairn/users/${userId}/itinerary/${id}/password`;
        await ssm.send(new client_ssm_1.PutParameterCommand({
            Name: ssmPasswordPath,
            Value: body.password,
            Type: 'SecureString',
            Overwrite: true,
        }));
        const item = {
            pk,
            sk,
            name: body.name,
            appleId: body.appleId,
            serverUrl: body.serverUrl ?? 'https://caldav.icloud.com',
            color: body.color ?? '#007AFF',
            syncEnabled: body.syncEnabled ?? true,
            ssmPasswordPath,
            createdAt: now,
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({ TableName: db_1.TABLE_NAME, Item: item }));
        const { ssmPasswordPath: _omit, ...publicItem } = item;
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({ ...publicItem, id }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map