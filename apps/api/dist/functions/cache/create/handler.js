"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const markers_1 = require("../../shared/markers");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        if (!body.markerId || body.limit === undefined || body.month === undefined || body.year === undefined) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('markerId, limit, month, and year are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const id = (0, crypto_1.randomUUID)();
        const sk = `CACHE#${body.markerId}#${body.month}#${body.year}`;
        const markers = await (0, markers_1.resolveMarkersById)(pk, [body.markerId]);
        const marker = markers.get(body.markerId);
        const cache = {
            pk,
            sk,
            id,
            markerId: body.markerId,
            markerName: body.markerName ?? marker?.name ?? '',
            limit: body.limit,
            month: body.month,
            year: body.year,
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: cache,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)(cache));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map