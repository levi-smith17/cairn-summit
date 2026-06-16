type Item = Record<string, unknown>;
export declare function createMemoryDynamo(): {
    send: (command: unknown) => Promise<{
        Item: {
            [x: string]: unknown;
        } | undefined;
        Items?: undefined;
    } | {
        Item?: undefined;
        Items?: undefined;
    } | {
        Items: {
            [x: string]: unknown;
        }[];
        Item?: undefined;
    }>;
    reset: () => void;
    seed: (items: Item[]) => void;
};
export declare function getSharedMemoryDynamo(): {
    send: (command: unknown) => Promise<{
        Item: {
            [x: string]: unknown;
        } | undefined;
        Items?: undefined;
    } | {
        Item?: undefined;
        Items?: undefined;
    } | {
        Items: {
            [x: string]: unknown;
        }[];
        Item?: undefined;
    }>;
    reset: () => void;
    seed: (items: Item[]) => void;
};
export {};
//# sourceMappingURL=memory-dynamo.d.ts.map