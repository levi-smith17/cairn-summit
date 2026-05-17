"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name || !body.abbreviation || !body.type) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name, abbreviation, and type are required'));
        }
        const id = (0, crypto_1.randomUUID)();
        const sk = `RESOURCE#${id}`;
        const item = {
            pk: 'SF#RESOURCE',
            sk,
            name: body.name,
            abbreviation: body.abbreviation,
            type: body.type,
            tier: body.tier ?? null,
            mined: body.mined ?? false,
            ingredients: body.ingredients ?? [],
            createdAt: new Date().toISOString(),
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: item,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)(item));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map