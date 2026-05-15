"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const SETTINGS_SECTIONS = ['appearance', 'notifications', 'privacy', 'itinerary', 'waypoints', 'logs', 'signals'];
const ACCOUNT_FIELDS = ['name', 'image', 'username', 'timeFormat', 'listed', 'defaultTerminology', 'defaultTheme', 'headline', 'summary', 'location', 'linkedin', 'github', 'customDomain'];
const handler = async (event) => {
    try {
        const section = event.pathParameters?.section;
        if (!section)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing section'));
        const body = JSON.parse(event.body ?? '{}');
        const pk = (0, auth_1.getPk)(event);
        if (section === 'account') {
            const setExprs = [];
            const exprNames = {};
            const exprValues = {};
            for (const field of ACCOUNT_FIELDS) {
                if (field in body) {
                    const placeholder = `:${field}`;
                    const nameKey = `#${field}`;
                    setExprs.push(`${nameKey} = ${placeholder}`);
                    exprNames[nameKey] = field;
                    exprValues[placeholder] = body[field];
                }
            }
            if (setExprs.length === 0)
                return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('No valid account fields provided'));
            const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk, sk: 'PROFILE' },
                UpdateExpression: `SET ${setExprs.join(', ')}`,
                ExpressionAttributeNames: exprNames,
                ExpressionAttributeValues: exprValues,
                ReturnValues: 'ALL_NEW',
            }));
            return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(result.Attributes));
        }
        if (!SETTINGS_SECTIONS.includes(section)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)(`Invalid section: ${section}`));
        }
        const result = await db_1.dynamo.send(new lib_dynamodb_1.UpdateCommand({
            TableName: db_1.TABLE_NAME,
            Key: { pk, sk: 'SETTINGS' },
            UpdateExpression: 'SET #section = :data',
            ExpressionAttributeNames: { '#section': section },
            ExpressionAttributeValues: { ':data': body },
            ReturnValues: 'ALL_NEW',
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(result.Attributes?.[section]));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map