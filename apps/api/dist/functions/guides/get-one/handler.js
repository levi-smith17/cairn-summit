"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing id'));
        const pk = (0, auth_1.getPk)(event);
        const [guideResult, stonesResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk, sk: `GUIDE#${id}` },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': `STONE#${id}#`,
                },
            })),
        ]);
        const guide = guideResult.Item;
        if (!guide)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Guide not found'));
        const stones = (stonesResult.Items ?? []).map(stone => ({
            id: stone.sk.split('#').pop(),
            face: stone.face,
            core: stone.core,
            placement: stone.placement,
            markers: stone.markers ?? [],
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            pk: guide.pk,
            sk: guide.sk,
            id,
            name: guide.name,
            description: guide.description,
            trailId: guide.trailId,
            createdAt: guide.createdAt,
            stones,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map