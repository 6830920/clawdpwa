/**
 * PWA Channel Plugin for OpenClaw
 *
 * This plugin provides a PWA (Progressive Web App) channel for OpenClaw Gateway,
 * allowing users to interact with OpenClaw through a browser-based PWA client.
 */
import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";
import { pwaPlugin } from "./src/channel.js";
const plugin = {
    id: "pwa",
    name: "PWA",
    description: "PWA (Progressive Web App) channel plugin for OpenClaw Gateway",
    configSchema: emptyPluginConfigSchema(),
    register(api) {
        api.registerChannel({ plugin: pwaPlugin });
    },
};
export default plugin;
export { pwaPlugin } from "./src/channel.js";
//# sourceMappingURL=index.js.map