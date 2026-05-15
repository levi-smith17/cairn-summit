"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const auth_1 = require("../../shared/auth");
const response_1 = require("../../shared/response");
function normalizeToMonthly(amount, billingCycle) {
    switch (billingCycle) {
        case 'WEEKLY': return amount * 52 / 12;
        case 'BIWEEKLY': return amount * 26 / 12;
        case 'MONTHLY': return amount;
        case 'QUARTERLY': return amount / 3;
        case 'ANNUALLY': return amount / 12;
    }
}
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
        const pk = (0, auth_1.getPk)(event);
        const [supplylineResult, burnResult, cacheResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'SUPPLYLINE#' },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'BURN#' },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: { ':pk': pk, ':prefix': 'CACHE#' },
            })),
        ]);
        const supplylines = (supplylineResult.Items ?? []);
        const burnItems = (burnResult.Items ?? []);
        const cacheItems = (cacheResult.Items ?? []);
        const activeSupplylines = supplylines.filter(s => s.active);
        const monthlySupplylineCost = activeSupplylines.reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.billingCycle), 0);
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const monthBurn = burnItems.filter(b => b.date.startsWith(monthPrefix));
        const totalBurn = monthBurn.reduce((sum, b) => sum + b.amount, 0);
        const totalMonthSpend = monthlySupplylineCost + totalBurn;
        const now = new Date();
        const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingRenewals = activeSupplylines
            .filter(s => {
            const renewal = new Date(s.nextRenewal);
            return renewal >= now && renewal <= sevenDaysOut;
        })
            .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime())
            .map(s => ({
            id: s.sk.split('#').pop(),
            name: s.name,
            amount: s.amount,
            nextRenewal: s.nextRenewal,
            billingCycle: s.billingCycle,
        }));
        const monthCache = cacheItems.filter(c => {
            const parts = c.sk.split('#');
            return parts[2] === String(month) && parts[3] === String(year);
        });
        const cacheUtilization = monthCache.map(c => {
            const parts = c.sk.split('#');
            const markerId = parts[1];
            const spent = monthBurn
                .filter(b => b.markers.some(m => m.id === markerId))
                .reduce((sum, b) => sum + b.amount, 0);
            return {
                id: c.id,
                markerId,
                limit: c.limit,
                spent,
            };
        });
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            summary: {
                monthlySupplylineCost,
                totalBurn,
                totalMonthSpend,
                activeSupplylines: activeSupplylines.length,
            },
            upcomingRenewals,
            cacheUtilization,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map