/**
 * PWA Channel Implementation for OpenClaw
 *
 * This channel implements a plugin for PWA client connectivity to OpenClaw Gateway.
 */

/**
 * PWA Channel Metadata
 */
const meta = {
  id: "pwa",
  label: "PWA",
  selectionLabel: "PWA (Progressive Web App)",
  docsPath: "/channels/pwa",
  aliases: ["pwa", "web"],
  order: 100,
};

/**
 * PWA Channel Capabilities
 */
const capabilities = {
  chatTypes: ["direct"],
  polls: false,
  threads: true,
  media: true,
  reactions: false,
  edit: true,
  reply: true,
};

/**
 * Configuration methods for PWA channel accounts
 */
const config = {
  listAccountIds: (cfg: any) => {
    return Object.keys(cfg.channels?.pwa?.accounts ?? {});
  },

  resolveAccount: (cfg: any, accountId: string) => {
    const accounts = cfg.channels?.pwa?.accounts ?? {};
    return accounts[accountId || "default"] || { accountId: accountId || "default" };
  },
};

/**
 * Send a message to PWA client
 *
 * This is called by OpenClaw Gateway when it wants to send a message
 * to the PWA client.
 */
const outbound = {
  deliveryMode: "direct" as const,
  sendText: async ({ context, message, threadId }: any) => {
    const { account, runtime } = context;

    // Extract text from message
    const text = typeof message === "string" ? message : message?.text || "";

    // Create PWA message payload
    const payload = {
      type: "message",
      accountId: account.id,
      threadId,
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Emit to PWA client via Gateway's event system
    await runtime.events.emit(`channel:pwa:${account.id}:outbound`, payload);

    return { ok: true };
  },
};

/**
 * PWA Channel Plugin
 *
 * This is the main plugin object that implements the channel interface.
 */
export const pwaPlugin = {
  id: "pwa",
  meta,
  capabilities,
  config,
  outbound,
  // Add setup function
  setup: async (api: any) => {
    console.log("[PWA Channel] Setup called");
    return { ok: true };
  },
  // Add status check
  status: async (context: any) => {
    return {
      connected: true,
      status: "ok",
      account: context.account,
    };
  },
};
