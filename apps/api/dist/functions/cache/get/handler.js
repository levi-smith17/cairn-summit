"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const params = event.queryStringParameters ?? {};
        if (!params.month || !params.year) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('month and year are required'));
        }
        const month = parseInt(params.month, 10);
        const year = parseInt(params.year, 10);
        if (isNaN(month) || isNaN(year)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('month and year must be numbers'));
        }
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'CACHE#',
            },
        }));
        const cache = (result.Items ?? [])
            .filter(b => {
            const parts = b.sk.split('#');
            return parts[2] === String(month) && parts[3] === String(year);
        });
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(cache));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map