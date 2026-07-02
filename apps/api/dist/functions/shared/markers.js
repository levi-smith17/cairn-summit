"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMarkersById = resolveMarkersById;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const db_1 = require("./db");
async function resolveMarkersById(pk, markerIds) {
    const unique = [...new Set(markerIds.filter(Boolean))];
    if (!unique.length)
        return new Map();
    const result = await db_1.dynamo.send(new lib_dynamodb_1.BatchGetCommand({
        RequestItems: {
            [db_1.TABLE_NAME]: {
                Keys: unique.map(id => ({ pk, sk: `MARKER#${id}` })),
            },
        },
    }));
    const map = new Map();
    for (const item of result.Responses?.[db_1.TABLE_NAME] ?? []) {
        const id = item.sk.split('#').pop();
        map.set(id, {
            id,
            name: item.name,
            color: item.color,
            ...(item.icon ? { icon: item.icon } : {}),
        });
    }
    return map;
}
//# sourceMappingURL=markers.js.map