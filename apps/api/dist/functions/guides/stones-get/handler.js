"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const guideId = event.pathParameters?.guideId;
        if (!guideId) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing guideId'));
        }
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': `STONE#${guideId}#`,
            },
        }));
        const stones = (result.Items ?? []).map(item => ({
            pk: item.pk,
            sk: item.sk,
            id: item.sk.split('#').pop(),
            guideId: item.guideId,
            face: item.face,
            core: item.core,
            placement: item.placement,
            markers: item.markers ?? [],
            createdAt: item.createdAt,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(stones));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map