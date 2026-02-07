declare module "clawdbot/plugin-sdk" {
  export interface ClawdbotPluginApi {
    registerChannel(params: { plugin: any }): void;
    runtime: any;
  }

  export function emptyPluginConfigSchema(): any;
}
