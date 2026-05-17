"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name || !body.species) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name and species are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const id = (0, crypto_1.randomUUID)();
        const sk = `COMPANION#${id}`;
        const item = {
            pk,
            sk,
            id,
            name: body.name,
            species: body.species,
            passed: body.passed ?? false,
            ...(body.breed !== undefined ? { breed: body.breed } : {}),
            ...(body.birthday !== undefined ? { birthday: body.birthday } : {}),
            ...(body.bio !== undefined ? { bio: body.bio } : {}),
            createdAt: new Date().toISOString(),
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({ TableName: db_1.TABLE_NAME, Item: item }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)(item));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map