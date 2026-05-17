"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const UPDATABLE_FIELDS = ['name', 'appleId', 'serverUrl', 'color', 'syncEnabled'];
const handler = async (event) => {
    try {
        const ssm = new client_ssm_1.SSMClient({ region: process.env.AWS_REGION });
        const id = (0, auth_1.getPathId)(event);
        if (!id)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing itinerary id'));
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        const sk = `ITINERARY#${id}`;
        // Fetch existing item to get the SSM path (needed if updating password)
        if (body.password) {
            const existing = await db_1.dynamo.send(new lib_dynamodb_1.GetCommand({ TableName: db_1.TABLE_NAME, Key: { pk, sk } }));
            if (!existing.Item)
                return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Itinerary calendar not found'));
            await ssm.send(new client_ssm_1.PutParameterCommand({
                Name: existing.Item.ssmPasswordPath,
                Value: body.password,
                Type: 'SecureString',
                Overwrite: true,
            }));
        }
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
            Key: { pk, sk },
            UpdateExpression: `SET ${setExprs.join(', ')}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ConditionExpression: 'attribute_exists(pk)',
            ReturnValues: 'ALL_NEW',
        }));
        const { ssmPasswordPath: _omit, ...publicItem } = result.Attributes ?? {};
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ ...publicItem, id }));
    }
    catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Itinerary calendar not found'));
        }
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map