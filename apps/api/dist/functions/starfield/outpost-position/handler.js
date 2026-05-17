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
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing outpost id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        if (typeof body.x !== 'number' || typeof body.y !== 'number') {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('x and y must be numbers'));
        }
        const pk = (0, auth_1.getPk)(event);
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${id}` },
            UpdateExpression: 'SET #position = :pos',
            ExpressionAttributeNames: { '#position': 'position' },
            ExpressionAttributeValues: { ':pos': { x: body.x, y: body.y } },
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