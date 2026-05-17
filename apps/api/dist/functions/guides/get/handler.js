"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const [guidesResult, stonesResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'GUIDE#',
                },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'STONE#',
                },
            })),
        ]);
        const stonesByGuideId = new Map();
        for (const stone of (stonesResult.Items ?? [])) {
            const parts = stone.sk.split('#');
            const guideId = parts[1];
            const stoneId = parts[2];
            const mapped = {
                id: stoneId,
                face: stone.face,
                core: stone.core,
                placement: stone.placement,
                markers: stone.markers ?? [],
            };
            if (!stonesByGuideId.has(guideId)) {
                stonesByGuideId.set(guideId, []);
            }
            stonesByGuideId.get(guideId).push(mapped);
        }
        const guides = (guidesResult.Items ?? []).map(guide => {
            const id = guide.sk.split('#').pop();
            return {
                pk: guide.pk,
                sk: guide.sk,
                id,
                name: guide.name,
                description: guide.description,
                trailId: guide.trailId,
                createdAt: guide.createdAt,
                stones: stonesByGuideId.get(id) ?? [],
            };
        });
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(guides));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map