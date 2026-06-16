"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMemoryDynamo = createMemoryDynamo;
exports.getSharedMemoryDynamo = getSharedMemoryDynamo;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
function itemKey(pk, sk) {
    return `${pk}\0${sk}`;
}
function createMemoryDynamo() {
    const store = new Map();
    return {
        send: async (command) => {
            if (command instanceof lib_dynamodb_1.GetCommand) {
                const { pk, sk } = command.input.Key;
                const item = store.get(itemKey(pk, sk));
                return { Item: item ? { ...item } : undefined };
            }
            if (command instanceof lib_dynamodb_1.PutCommand) {
                const item = command.input.Item;
                store.set(itemKey(item.pk, item.sk), { ...item });
                return {};
            }
            if (command instanceof lib_dynamodb_1.QueryCommand) {
                const pk = command.input.ExpressionAttributeValues?.[':pk'];
                const prefix = command.input.ExpressionAttributeValues?.[':prefix'];
                const items = [...store.values()].filter(i => {
                    if (i.pk !== pk)
                        return false;
                    if (prefix && !String(i.sk).startsWith(prefix))
                        return false;
                    return true;
                });
                return { Items: items.map(i => ({ ...i })) };
            }
            if (command instanceof lib_dynamodb_1.ScanCommand) {
                const values = command.input.ExpressionAttributeValues ?? {};
                const filter = command.input.FilterExpression ?? '';
                const items = [...store.values()].filter(i => {
                    if (filter.includes('sk = :sk') && i.sk !== values[':sk']) {
                        return false;
                    }
                    if (filter.includes('username = :username')
                        && i.username !== values[':username']) {
                        return false;
                    }
                    return true;
                });
                return { Items: items.map(i => ({ ...i })) };
            }
            throw new Error(`Unsupported DynamoDB command: ${command.constructor?.name}`);
        },
        reset: () => store.clear(),
        seed: (items) => {
            for (const item of items) {
                store.set(itemKey(item.pk, item.sk), { ...item });
            }
        },
    };
}
let sharedMemory = null;
function getSharedMemoryDynamo() {
    if (!sharedMemory)
        sharedMemory = createMemoryDynamo();
    return sharedMemory;
}
//# sourceMappingURL=memory-dynamo.js.map