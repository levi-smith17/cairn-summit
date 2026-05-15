"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
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
        const id = (0, auth_1.getPathId)(event);
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing log id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        if (!body.content) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('content is required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const sk = `LOG#${id}`;
        const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : []);
        const setExprs = ['#content = :content', 'markers = :markers', 'updatedAt = :updatedAt'];
        const removeExprs = [];
        const exprNames = { '#content': 'content' };
        const exprValues = {
            ':content': body.content,
            ':markers': markers,
            ':updatedAt': new Date().toISOString(),
        };
        if (body.title) {
            setExprs.push('#title = :title');
            exprNames['#title'] = 'title';
            exprValues[':title'] = body.title;
        }
        else {
            removeExprs.push('title');
        }
        if (body.trailId) {
            setExprs.push('trailId = :trailId');
            exprValues[':trailId'] = body.trailId;
        }
        else {
            removeExprs.push('trailId');
        }
        if (body.waypointId) {
            setExprs.push('waypointId = :waypointId');
            exprValues[':waypointId'] = body.waypointId;
        }
        else {
            removeExprs.push('waypointId');
        }
        let UpdateExpression = `SET ${setExprs.join(', ')}`;
        if (removeExprs.length > 0)
            UpdateExpression += ` REMOVE ${removeExprs.join(', ')}`;
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk },
            UpdateExpression,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
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