"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const params = event.queryStringParameters ?? {};
        if (!params.month || !params.year) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('month and year are required'));
        }
        const month = parseInt(params.month, 10);
        const year = parseInt(params.year, 10);
        if (isNaN(month) || isNaN(year)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('month and year must be numbers'));
        }
        const page = Math.max(1, parseInt(params.page ?? '1', 10));
        const pageSize = Math.max(1, parseInt(params.pageSize ?? '20', 10));
        const pk = (0, auth_1.getPk)(event);
        const result = await db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
            TableName: db_1.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'BURN#',
            },
        }));
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        let items = (result.Items ?? []).filter(e => e.date.startsWith(monthPrefix));
        if (params.search) {
            const term = params.search.toLowerCase();
            items = items.filter(e => e.name.toLowerCase().includes(term));
        }
        if (params.markerId) {
            items = items.filter(e => e.markers.some(m => m.id === params.markerId));
        }
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const total = items.length;
        const start = (page - 1) * pageSize;
        const paged = items.slice(start, start + pageSize);
        const burn = paged.map(e => ({
            ...e,
            id: e.sk.split('#').pop(),
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ burn, total, page, pageSize }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map