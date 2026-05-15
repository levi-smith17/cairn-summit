"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing network id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name || !body.abbreviation) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name and abbreviation are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SF#NETWORK#${id}` },
            UpdateExpression: 'SET #name = :name, abbreviation = :abbreviation',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: { ':name': body.name, ':abbreviation': body.abbreviation },
            ReturnValues: 'ALL_NEW',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(result.Attributes));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map