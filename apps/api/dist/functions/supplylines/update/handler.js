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
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing supplyline id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        const sk = `SUPPLYLINE#${id}`;
        const setExprs = [];
        const removeExprs = [];
        const exprNames = {};
        const exprValues = {};
        if ('name' in body) {
            setExprs.push('#name = :name');
            exprNames['#name'] = 'name';
            exprValues[':name'] = body.name;
        }
        if ('amount' in body) {
            setExprs.push('amount = :amount');
            exprValues[':amount'] = body.amount;
        }
        if ('billingCycle' in body) {
            setExprs.push('billingCycle = :billingCycle');
            exprValues[':billingCycle'] = body.billingCycle;
        }
        if ('nextRenewal' in body) {
            setExprs.push('nextRenewal = :nextRenewal');
            exprValues[':nextRenewal'] = body.nextRenewal;
        }
        if ('active' in body) {
            setExprs.push('active = :active');
            exprValues[':active'] = body.active;
        }
        if ('url' in body) {
            // `url` is a DynamoDB reserved keyword — always alias it.
            exprNames['#url'] = 'url';
            if (body.url) {
                setExprs.push('#url = :url');
                exprValues[':url'] = body.url;
            }
            else {
                removeExprs.push('#url');
            }
        }
        if ('notes' in body) {
            if (body.notes) {
                setExprs.push('notes = :notes');
                exprValues[':notes'] = body.notes;
            }
            else {
                removeExprs.push('notes');
            }
        }
        if ('markerIds' in body) {
            const markers = await resolveMarkers(pk, Array.isArray(body.markerIds) ? body.markerIds : []);
            setExprs.push('markers = :markers');
            exprValues[':markers'] = markers;
        }
        if ('fundId' in body) {
            if (body.fundId) {
                setExprs.push('fundId = :fundId');
                exprValues[':fundId'] = body.fundId;
            }
            else {
                removeExprs.push('fundId');
            }
        }
        if (setExprs.length === 0 && removeExprs.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No valid fields to update'));
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
            ...(Object.keys(exprValues).length > 0
                ? { ExpressionAttributeValues: exprValues }
                : {}),
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