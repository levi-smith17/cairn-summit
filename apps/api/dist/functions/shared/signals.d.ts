export interface CreateContactSignalInput {
    username: string;
    senderName: string;
    senderEmail: string;
    body: string;
}
export interface CreateContactSignalResult {
    id: string;
    token: string;
    threadUrl: string;
}
export declare function createContactSignal(input: CreateContactSignalInput): Promise<CreateContactSignalResult | null>;
//# sourceMappingURL=signals.d.ts.map