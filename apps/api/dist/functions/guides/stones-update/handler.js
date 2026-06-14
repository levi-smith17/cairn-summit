"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const id = (0, auth_1.getPathId)(event);
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing stone id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        const queryResult = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'contains(sk, :suffix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'STONE#',
                ':suffix': `#${id}`,
            },
            Limit: 1,
        }));
        const stone = queryResult.Items?.[0];
        if (!stone) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Stone not found'));
        }
        const setExpressions = [];
        const expressionAttributeValues = {};
        if (body.face !== undefined) {
            setExpressions.push('face = :face');
            expressionAttributeValues[':face'] = body.face;
        }
        if (body.core !== undefined) {
            setExpressions.push('core = :core');
            expressionAttributeValues[':core'] = body.core;
        }
        if (body.markerIds !== undefined) {
            let markers = [];
            const markerIds = body.markerIds;
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
            setExpressions.push('markers = :markers');
            expressionAttributeValues[':markers'] = markers;
        }
        if (setExpressions.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No fields to update'));
        }
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk: stone.pk, sk: stone.sk },
            UpdateExpression: `SET ${setExpressions.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(result.Attributes));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map