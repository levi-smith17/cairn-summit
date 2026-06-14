"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const invites_1 = require("../../shared/invites");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const token = event.pathParameters?.token;
        if (!token)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Missing token'));
        const body = JSON.parse(event.body ?? '{}');
        if (!body.email)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('email is required'));
        const result = await (0, invites_1.acceptInvitation)(token, body.email);
        if (!result.ok) {
            if (result.status === 404)
                return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Invitation not found'));
            if (result.status === 409)
                return (0, response_1.toApiGatewayResponse)((0, response_1.conflict)('Invitation already used'));
            if (result.status === 410)
                return (0, response_1.toApiGatewayResponse)((0, response_1.conflict)('Invitation expired'));
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Email does not match invitation'));
        }
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ accepted: true }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map