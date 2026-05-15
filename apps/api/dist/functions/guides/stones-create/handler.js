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
        const guideId = event.pathParameters?.guideId;
        if (!guideId) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing guideId'));
        }
        const body = JSON.parse(event.body ?? '{}');
        if (!body.face || !body.core) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('face and core are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const stoneId = (0, crypto_1.randomUUID)();
        const sk = `STONE#${guideId}#${stoneId}`;
        let markers = [];
        const markerIds = body.markerIds ?? [];
        if (markerIds.length > 0) {
            const batchResult = await db_1.dynamo.send(new lib_dynamodb_1.BatchGetCommand({
                RequestItems: {
                    [db_1.TABLE_NAME]: {
                        Keys: markerIds.map(mid => ({ pk, sk: `MARKER#${mid}` })),
                    },
                },
            }));
            const rawMarkers = batchResult.Responses?.[db_1.TABLE_NAME] ?? [];
            markers = rawMarkers.map(m => ({
                id: m.sk.split('#').pop(),
                name: m.name,
                color: m.color,
                ...(m.icon !== undefined && { icon: m.icon }),
            }));
        }
        const stone = {
            pk,
            sk,
            guideId,
            face: body.face,
            core: body.core,
            placement: 'UNPLACED',
            markers,
            createdAt: new Date().toISOString(),
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: stone,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)({ ...stone, id: stoneId }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map