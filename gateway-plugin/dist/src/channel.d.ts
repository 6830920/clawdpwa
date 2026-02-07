/**
 * PWA Channel Implementation for OpenClaw
 *
 * This channel implements a plugin for PWA client connectivity to OpenClaw Gateway.
 */
/**
 * PWA Channel Plugin
 *
 * This is the main plugin object that implements the channel interface.
 */
export declare const pwaPlugin: {
    id: string;
    meta: {
        id: string;
        label: string;
        selectionLabel: string;
        docsPath: string;
        aliases: string[];
        order: number;
    };
    capabilities: {
        chatTypes: string[];
        polls: boolean;
        threads: boolean;
        media: boolean;
        reactions: boolean;
        edit: boolean;
        reply: boolean;
    };
    config: {
        listAccountIds: (cfg: any) => string[];
        resolveAccount: (cfg: any, accountId: string) => any;
    };
    outbound: {
        deliveryMode: "direct";
        sendText: ({ context, message, threadId }: any) => Promise<{
            ok: boolean;
        }>;
    };
    setup: (api: any) => Promise<{
        ok: boolean;
    }>;
    status: (context: any) => Promise<{
        connected: boolean;
        status: string;
        account: any;
    }>;
};
//# sourceMappingURL=channel.d.ts.map