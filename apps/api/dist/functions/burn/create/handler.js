"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
async function resolveMarkers(pk, markerIds) {
    if (!markerIds.length)
        return [];
    const result = await db_1.dynamo.send(new lib_dynamodb_1.BatchGetCommand({
        RequestItems: {
            [db_1.TABLE_NAME]: {
                Keys: markerIds.map(mid => ({ pk, sk: `MARKER#${mid}` })),
            },
        },
    }));
    return (result.Responses?.[db_1.TABLE_NAME] ?? []).map((m) => ({
        id: m.sk.split('#').pop(),
        name: m.name,
        color: m.color,
        ...(m.icon ? { icon: m.icon } : {}),
    }));
}
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        if (!body.name || body.amount === undefined || !body.date) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('name, amount, and date are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const id = (0, crypto_1.randomUUID)();
        const sk = `BURN#${id}`;
        const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : []);
        const burn = {
            pk,
            sk,
            id,
            name: body.name,
            amount: body.amount,
            date: body.date,
            ...(body.notes ? { notes: body.notes } : {}),
            ...(body.receiptUrl ? { receiptUrl: body.receiptUrl } : {}),
            markers,
            createdAt: new Date().toISOString(),
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: burn,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)(burn));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map