/**
 * PWA Channel Plugin for OpenClaw
 *
 * This plugin provides a PWA (Progressive Web App) channel for OpenClaw Gateway,
 * allowing users to interact with OpenClaw through a browser-based PWA client.
 */
import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";
declare const plugin: {
    id: string;
    name: string;
    description: string;
    configSchema: any;
    register(api: ClawdbotPluginApi): void;
};
export default plugin;
export { pwaPlugin } from "./src/channel.js";
//# sourceMappingURL=index.d.ts.map