"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../../shared/auth");
const itinerary_events_1 = require("../../shared/itinerary-events");
const response_1 = require("../../shared/response");
const handler = async (event) => {
    try {
        const pk = (0, auth_1.getPk)(event);
        const qs = event.queryStringParameters ?? {};
        const from = qs.from ? new Date(qs.from) : undefined;
        const to = qs.to ? new Date(qs.to) : undefined;
        const events = await (0, itinerary_events_1.fetchUserItineraryEvents)(pk, from, to);
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ events }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map