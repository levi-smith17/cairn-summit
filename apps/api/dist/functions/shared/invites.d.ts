export declare function getPublicInvite(token: string): Promise<{
    email: string;
    note: string | null;
    expiresAt: string;
    usedAt: string | null;
    invitedBy: {
        name: string | null;
        email: string | null;
    };
} | null>;
export declare function acceptInvitation(token: string, email: string): Promise<{
    ok: false;
    status: 404;
} | {
    ok: false;
    status: 409;
} | {
    ok: false;
    status: 410;
} | {
    ok: false;
    status: 400;
} | {
    ok: true;
    status?: undefined;
}>;
export declare function writeInviteLookup(token: string, invitationId: string): Promise<void>;
export declare function deleteInviteLookup(token: string): Promise<void>;
//# sourceMappingURL=invites.d.ts.map