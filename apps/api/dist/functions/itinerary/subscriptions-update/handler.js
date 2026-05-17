"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const UPDATABLE_FIELDS = ['name', 'url', 'color', 'syncEnabled'];
const handler = async (event) => {
    try {
        const id = (0, auth_1.getPathId)(event);
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing subscription id'));
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        const setExprs = [];
        const exprNames = {};
        const exprValues = {};
        for (const field of UPDATABLE_FIELDS) {
            if (field in body) {
                setExprs.push(`#${field} = :${field}`);
                exprNames[`#${field}`] = field;
                exprValues[`:${field}`] = body[field];
            }
        }
        if (setExprs.length === 0)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No valid fields to update'));
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `ITINERARY_SUB#${id}` },
            UpdateExpression: `SET ${setExprs.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ConditionExpression: 'attribute_exists(pk)',
            ReturnValues: 'ALL_NEW',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ ...result.Attributes, id }));
    }
    catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Calendar subscription not found'));
        }
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map