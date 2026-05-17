"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body ?? '{}');
        if (body.month === undefined || body.year === undefined) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('month and year are required'));
        }
        const month = body.month;
        const year = body.year;
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const pk = (0, auth_1.getPk)(event);
        const [prevResult, currentResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'CACHE#' },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'CACHE#' },
            })),
        ]);
        const prevBudgets = (prevResult.Items ?? [])
            .filter(b => {
            const parts = b.sk.split('#');
            return parts[2] === String(prevMonth) && parts[3] === String(prevYear);
        });
        const existingMarkerIds = new Set((currentResult.Items ?? [])
            .filter(b => {
            const parts = b.sk.split('#');
            return parts[2] === String(month) && parts[3] === String(year);
        })
            .map(b => b.markerId));
        const toCreate = prevBudgets.filter(b => !existingMarkerIds.has(b.markerId));
        if (toCreate.length === 0) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ count: 0 }));
        }
        const newItems = toCreate.map(b => ({
            pk,
            sk: `CACHE#${b.markerId}#${month}#${year}`,
            id: (0, crypto_1.randomUUID)(),
            markerId: b.markerId,
            markerName: b.markerName,
            limit: b.limit,
            month,
            year,
        }));
        const chunks = [];
        for (let i = 0; i < newItems.length; i += 25) {
            chunks.push(newItems.slice(i, i + 25));
        }
        await Promise.all(chunks.map(chunk => db_1.dynamo.send(new lib_dynamodb_1.BatchWriteCommand({
            RequestItems: {
                [db_1.TABLE_NAME]: chunk.map(item => ({
                    PutRequest: { Item: item },
                })),
            },
        }))));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ count: newItems.length }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map