"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const systemId = event.pathParameters?.id;
        const planetId = event.pathParameters?.planetId;
        if (!systemId || !planetId) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing system or planet id'));
        }
        const getResult = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
        }));
        if (!getResult.Item) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('System not found'));
        }
        const planets = getResult.Item.planets ?? [];
        const filtered = planets.filter(p => p.id !== planetId);
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
            UpdateExpression: 'SET planets = :planets',
            ExpressionAttributeValues: { ':planets': filtered },
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