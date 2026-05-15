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
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing summit id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        const setExprs = [];
        const removeExprs = [];
        const exprNames = {};
        const exprValues = {};
        const fields = [
            { key: 'title', alias: '#title' },
            { key: 'issuer', alias: '#issuer' },
            { key: 'date', alias: '#date' },
            { key: 'description', alias: '#desc' },
            { key: 'url', alias: '#url' },
        ];
        for (const field of fields) {
            if (field.key in body) {
                exprNames[field.alias] = field.key;
                if (body[field.key] !== null && body[field.key] !== undefined) {
                    setExprs.push(`${field.alias} = :${field.key}`);
                    exprValues[`:${field.key}`] = body[field.key];
                }
                else {
                    removeExprs.push(field.alias);
                }
            }
        }
        const parts = [];
        if (setExprs.length > 0)
            parts.push(`SET ${setExprs.join(', ')}`);
        if (removeExprs.length > 0)
            parts.push(`REMOVE ${removeExprs.join(', ')}`);
        if (parts.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No fields provided to update'));
        }
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SUMMIT#${id}` },
            UpdateExpression: parts.join(' '),
            ExpressionAttributeNames: exprNames,
            ...(Object.keys(exprValues).length > 0 ? { ExpressionAttributeValues: exprValues } : {}),
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