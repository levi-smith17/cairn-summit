"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const api_token_1 = require("../../shared/api-token");
const response_1 = require("../../shared/response");
async function deleteExistingToken(pk, tokenHash) {
    if (typeof tokenHash === 'string') {
        await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
            TableName: db_1.TABLE_NAME,
            Key: {
                pk: `TOKEN#${tokenHash}`,
                sk: 'META',
            },
        }));
    }
    await db_1.dynamo.send(new lib_dynamodb_1.DeleteCommand({
        TableName: db_1.TABLE_NAME,
        Key: { pk, sk: 'API_TOKEN' },
    }));
}
const handler = async (event) => {
    try {
        const userId = (0, auth_1.getUserId)(event);
        const pk = (0, auth_1.getPk)(event);
        const existing = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'API_TOKEN' },
        }));
        if (existing.Item?.tokenHash) {
            await deleteExistingToken(pk, existing.Item.tokenHash);
        }
        const token = (0, api_token_1.generateApiToken)();
        const tokenHash = (0, api_token_1.hashApiToken)(token);
        const createdAt = new Date().toISOString();
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: {
                pk,
                sk: 'API_TOKEN',
                tokenHash,
                tokenPrefix: (0, api_token_1.tokenPrefixFromToken)(token),
                createdAt,
            },
        }));
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: {
                pk: `TOKEN#${tokenHash}`,
                sk: 'META',
                userId,
                tokenPrefix: (0, api_token_1.tokenPrefixFromToken)(token),
                createdAt,
            },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({
            token,
            tokenPrefix: (0, api_token_1.tokenPrefixFromToken)(token),
            createdAt,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map