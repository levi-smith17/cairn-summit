"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
// Max items DynamoDB examines per Scan page — prevents unbounded table scans
const SCAN_PAGE_SIZE = 1000;
const handler = async (event) => {
    try {
        const rawCursor = event.queryStringParameters?.cursor;
        const exclusiveStartKey = rawCursor
            ? JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8'))
            : undefined;
        const scanResult = await db_1.dynamo.send(new lib_dynamodb_1.ScanCommand({
            TableName: db_1.TABLE_NAME,
            FilterExpression: 'sk = :sk',
            ExpressionAttributeValues: { ':sk': 'PROFILE' },
            Limit: SCAN_PAGE_SIZE,
            ExclusiveStartKey: exclusiveStartKey,
        }));
        const profiles = scanResult.Items ?? [];
        const wayfarers = await Promise.all(profiles.map(async (profile) => {
            const pk = profile.pk;
            const userId = pk.replace('USER#', '');
            const [expeditionResult, gearResult] = await Promise.all([
                db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                    TableName: db_1.TABLE_NAME,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                    ExpressionAttributeValues: { ':pk': pk, ':prefix': 'EXPEDITION#' },
                    Select: 'COUNT',
                })),
                db_1.dynamo.send(new lib_dynamodb_1.QueryCommand({
                    TableName: db_1.TABLE_NAME,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
                    ExpressionAttributeValues: { ':pk': pk, ':prefix': 'GEAR#' },
                })),
            ]);
            const topGear = (gearResult.Items ?? [])
                .map((g) => g.name)
                .filter(Boolean)
                .slice(0, 5);
            return {
                id: userId,
                name: (profile.name ?? null),
                email: (profile.email ?? null),
                image: (profile.image ?? null),
                username: (profile.username ?? null),
                location: (profile.location ?? null),
                expeditionCount: expeditionResult.Count ?? 0,
                topGear,
                memberSince: profile.createdAt,
            };
        }));
        const nextCursor = scanResult.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(scanResult.LastEvaluatedKey)).toString('base64url')
            : null;
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ wayfarers, nextCursor }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map