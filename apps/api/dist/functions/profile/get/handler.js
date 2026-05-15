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
        const [profileResult, signalResult, stopCountResult] = await Promise.all([
            db_1.dynamo.send(new lib_dynamodb_1.GetCommand({
                TableName: db_1.TABLE_NAME,
                Key: { pk, sk: 'PROFILE' },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'SIGNAL#',
                },
            })),
            db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                TableName: db_1.TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':prefix': 'STOP#',
                },
                Select: 'COUNT',
            })),
        ]);
        if (!profileResult.Item)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Profile not found'));
        const profile = profileResult.Item;
        const signals = (signalResult.Items ?? []).filter((s) => !s.sk.includes('#REPLY#'));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({
            username: profile.username ?? null,
            name: profile.name ?? null,
            email: profile.email ?? null,
            image: profile.image ?? null,
            isAdmin: profile.isAdmin ?? false,
            signals: signals.length,
            itinerary: stopCountResult.Count ?? 0,
        }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map