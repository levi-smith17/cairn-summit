"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const params = event.queryStringParameters ?? {};
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SUPPLYLINE#',
            },
        }));
        let items = (result.Items ?? []);
        if (params.search) {
            const term = params.search.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(term));
        }
        if (params.markerId) {
            items = items.filter(p => p.markers.some(m => m.id === params.markerId));
        }
        if (params.active !== undefined) {
            const activeFilter = params.active === 'true';
            items = items.filter(p => p.active === activeFilter);
        }
        const supplylines = items.map(p => ({
            ...p,
            id: p.sk.split('#').pop(),
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(supplylines));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map