"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'API_TOKEN' },
        }));
        if (!result.Item) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ configured: false }));
        }
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            configured: true,
            tokenPrefix: result.Item.tokenPrefix,
            createdAt: result.Item.createdAt,
            lastUsedAt: result.Item.lastUsedAt ?? null,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map