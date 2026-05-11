"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_NAME = exports.dynamo = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION ?? 'us-east-2'
});
exports.dynamo = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false
    }
});
exports.TABLE_NAME = process.env.DYNAMODB_TABLE ?? 'cairn-dev';
//# sourceMappingURL=db.js.map