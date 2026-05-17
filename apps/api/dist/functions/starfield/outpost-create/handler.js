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
        if (!body.networkId || !body.system || !body.planet) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('networkId, system, and planet are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const id = (0, crypto_1.randomUUID)();
        const sk = `SF#FACILITY#${id}`;
        const item = {
            pk,
            sk,
            networkId: body.networkId,
            system: body.system,
            planet: body.planet,
            parentId: body.parentId,
            depth: body.parentId ? 1 : 0,
            position: { x: 0, y: 0 },
            resources: {},
            transferStationLimit: body.transferStationLimit ?? 32,
            createdAt: new Date().toISOString(),
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: item,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({ ...item, resources: [] }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map