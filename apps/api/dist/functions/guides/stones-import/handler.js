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
        const stones = body.stones ?? [];
        if (stones.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('stones array is required and must not be empty'));
        }
        const pk = (0, auth_1.getPk)(event);
        const allMarkerIds = [...new Set(stones.flatMap(s => s.markerIds ?? []))];
        const markerMap = new Map();
        if (allMarkerIds.length > 0) {
            for (let i = 0; i < allMarkerIds.length; i += 100) {
                const chunk = allMarkerIds.slice(i, i + 100);
                const batchResult = await db_1.dynamo.send(new lib_dynamodb_1.BatchGetCommand({
                    RequestItems: {
                        [db_1.TABLE_NAME]: {
                            Keys: chunk.map(mid => ({ pk, sk: `MARKER#${mid}` })),
                        },
                    },
                }));
                for (const m of (batchResult.Responses?.[db_1.TABLE_NAME] ?? [])) {
                    const mid = m.sk.split('#').pop();
                    markerMap.set(mid, {
                        id: mid,
                        name: m.name,
                        color: m.color,
                        ...(m.icon !== undefined && { icon: m.icon }),
                    });
                }
            }
        }
        const now = new Date().toISOString();
        const items = stones.map(stone => {
            const stoneId = (0, crypto_1.randomUUID)();
            const markers = (stone.markerIds ?? [])
                .map(mid => markerMap.get(mid))
                .filter(Boolean);
            return {
                pk,
                sk: `STONE#${guideId}#${stoneId}`,
                guideId,
                face: stone.face,
                core: stone.core,
                placement: 'UNPLACED',
                markers,
                createdAt: now,
            };
        });
        for (let i = 0; i < items.length; i += 25) {
            const chunk = items.slice(i, i + 25);
            await db_1.dynamo.send(new lib_dynamodb_1.BatchWriteCommand({
                RequestItems: {
                    [db_1.TABLE_NAME]: chunk.map(item => ({
                        PutRequest: { Item: item },
                    })),
                },
            }));
        }
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ count: items.length }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map