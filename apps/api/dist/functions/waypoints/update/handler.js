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
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing waypoint id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        const hasContentUpdate = 'title' in body || 'url' in body;
        const hasReadUpdate = 'read' in body || 'readLater' in body;
        if (hasContentUpdate && (!body.title || !body.url)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('title and url are required'));
        }
        if (!hasContentUpdate && !hasReadUpdate) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No valid fields to update'));
        }
        const pk = (0, auth_1.getPk)(event);
        const sk = `WAYPOINT#${id}`;
        const setExprs = [];
        const removeExprs = [];
        const exprNames = {};
        const exprValues = {};
        // Read/readLater can be updated independently of content fields
        if ('read' in body) {
            setExprs.push('#read = :read');
            exprNames['#read'] = 'read';
            exprValues[':read'] = body.read;
        }
        if ('readLater' in body) {
            setExprs.push('readLater = :readLater');
            exprValues[':readLater'] = body.readLater;
        }
        if (hasContentUpdate) {
            const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : []);
            setExprs.push('#title = :title', '#url = :url', 'markers = :markers');
            exprNames['#title'] = 'title';
            exprNames['#url'] = 'url';
            exprValues[':title'] = body.title;
            exprValues[':url'] = body.url;
            exprValues[':markers'] = markers;
            if (body.description) {
                setExprs.push('description = :description');
                exprValues[':description'] = body.description;
            }
            else {
                removeExprs.push('description');
            }
            if (body.notes) {
                setExprs.push('notes = :notes');
                exprValues[':notes'] = body.notes;
            }
            else {
                removeExprs.push('notes');
            }
            if (body.favicon) {
                setExprs.push('favicon = :favicon');
                exprValues[':favicon'] = body.favicon;
            }
            else {
                removeExprs.push('favicon');
            }
            if (body.trailId) {
                setExprs.push('trailId = :trailId', 'gsi1pk = :gsi1pk', 'gsi1sk = :gsi1sk');
                exprValues[':trailId'] = body.trailId;
                exprValues[':gsi1pk'] = `TRAIL#${body.trailId}`;
                exprValues[':gsi1sk'] = sk;
            }
            else {
                removeExprs.push('trailId', 'gsi1pk', 'gsi1sk');
            }
        }
        const parts = [];
        if (setExprs.length > 0)
            parts.push(`SET ${setExprs.join(', ')}`);
        if (removeExprs.length > 0)
            parts.push(`REMOVE ${removeExprs.join(', ')}`);
        const UpdateExpression = parts.join(' ');
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk },
            UpdateExpression,
            ...(Object.keys(exprNames).length > 0 ? { ExpressionAttributeNames: exprNames } : {}),
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