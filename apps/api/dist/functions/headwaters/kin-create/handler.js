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
        if (!body.givenName || !body.surname) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('givenName and surname are required'));
        }
        const pk = (0, auth_1.getPk)(event);
        const id = body.isSelf === true ? 'WAYFARER' : (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const kin = {
            pk,
            sk: `KIN#${id}`,
            givenName: body.givenName,
            middleName: body.middleName,
            nickname: body.nickname,
            surname: body.surname,
            maidenName: body.maidenName,
            isSelf: body.isSelf === true ? true : undefined,
            birthDate: body.birthDate,
            deathDate: body.deathDate,
            fatherId: body.fatherId,
            fatherUnknown: body.fatherUnknown ?? false,
            motherId: body.motherId,
            motherUnknown: body.motherUnknown ?? false,
            bloodlines: body.bloodlines ?? [],
            createdAt: now,
            updatedAt: now,
        };
        await db_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: db_1.TABLE_NAME,
            Item: kin,
        }));
        return (0, response_1.toApiGatewayResponse)((0, response_1.created)(kin));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map