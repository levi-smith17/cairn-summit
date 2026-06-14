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
        const invite = await (0, invites_1.getPublicInvite)(token);
        if (!invite)
            return (0, response_1.toApiGatewayResponse)((0, response_1.notFound)('Invitation not found'));
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)(invite));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map