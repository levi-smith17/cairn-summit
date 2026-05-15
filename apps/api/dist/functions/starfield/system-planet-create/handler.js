"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const systemId = event.pathParameters?.id;
        if (!systemId) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing system id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name is required'));
        }
        const planet = {
            id: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: body.name,
        };
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
            UpdateExpression: 'SET planets = list_append(if_not_exists(planets, :empty), :planet)',
            ExpressionAttributeValues: {
                ':planet': [planet],
                ':empty': [],
            },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)(planet));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map