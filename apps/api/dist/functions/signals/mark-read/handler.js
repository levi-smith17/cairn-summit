"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = (0, auth_1.getPathId)(event);
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing signal id'));
        const pk = (0, auth_1.getPk)(event);
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SIGNAL#${id}` },
            UpdateExpression: 'SET #read = :read',
            ExpressionAttributeNames: { '#read': 'read' },
            ExpressionAttributeValues: { ':read': true },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.noContent)());
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map