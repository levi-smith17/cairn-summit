"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const ALLOWED_FIELDS = ['system', 'planet', 'parentId', 'transferStationLimit'];
const handler = async (event) => {
    try {
        const id = event.pathParameters?.id;
        if (!id) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing outpost id'));
        }
        const body = JSON.parse(event.body ?? '{}');
        const setParts = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        for (const field of ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                const alias = `#${field}`;
                const placeholder = `:${field}`;
                setParts.push(`${alias} = ${placeholder}`);
                expressionAttributeNames[alias] = field;
                expressionAttributeValues[placeholder] = body[field];
            }
        }
        if (setParts.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No updatable fields provided'));
        }
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${id}` },
            UpdateExpression: `SET ${setParts.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));
        const attrs = result.Attributes ?? {};
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            ...attrs,
            resources: Object.values(attrs.resources ?? {}),
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map