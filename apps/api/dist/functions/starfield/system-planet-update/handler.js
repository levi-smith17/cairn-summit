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
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name is required'));
        }
        const getResult = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
        }));
        if (!getResult.Item) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('System not found'));
        }
        const planets = getResult.Item.planets ?? [];
        const idx = planets.findIndex(p => p.id === planetId);
        if (idx === -1) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Planet not found'));
        }
        const newId = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        planets[idx] = { id: newId, name: body.name };
        await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${systemId}` },
            UpdateExpression: 'SET planets = :planets',
            ExpressionAttributeValues: { ':planets': planets },
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(planets[idx]));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map