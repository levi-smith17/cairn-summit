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
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing guide id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        const setExpressions = [];
        const removeExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        if (body.name !== undefined) {
            setExpressions.push('#name = :name');
            expressionAttributeNames['#name'] = 'name';
            expressionAttributeValues[':name'] = body.name;
        }
        if (body.description === null) {
            removeExpressions.push('description');
        }
        else if (body.description !== undefined) {
            setExpressions.push('description = :description');
            expressionAttributeValues[':description'] = body.description;
        }
        if (body.trailId === null) {
            removeExpressions.push('trailId');
        }
        else if (body.trailId !== undefined) {
            setExpressions.push('trailId = :trailId');
            expressionAttributeValues[':trailId'] = body.trailId;
        }
        const parts = [];
        if (setExpressions.length > 0)
            parts.push(`SET ${setExpressions.join(', ')}`);
        if (removeExpressions.length > 0)
            parts.push(`REMOVE ${removeExpressions.join(', ')}`);
        if (parts.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No fields to update'));
        }
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `GUIDE#${id}` },
            UpdateExpression: parts.join(' '),
            ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
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