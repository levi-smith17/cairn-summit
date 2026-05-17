"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("../../shared/db");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const host = event.queryStringParameters?.host;
        if (!host)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('host is required'));
        // Scan is acceptable — low-frequency public endpoint, small table
        const result = await db_1.dynamo.send(new lib_dynamodb_1.ScanCommand({
            TableName: db_1.TABLE_NAME,
            FilterExpression: 'sk = :sk AND customDomain = :domain',
            ExpressionAttributeValues: {
                ':sk': 'PROFILE',
                ':domain': host,
            },
            ProjectionExpression: 'username',
        }));
        const username = result.Items?.[0]?.username ?? null;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
            body: JSON.stringify({ data: { username } }),
        };
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map