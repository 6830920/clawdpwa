/**
 * PWA 通道插件入口
 *
 * 这个文件是 OpenClaw Gateway 插件的入口点
 * OpenClaw Gateway 会加载并初始化这个插件
 */
import type { PWAChannelConfig } from './types';
export declare const meta: {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
};
export declare const defaultConfig: PWAChannelConfig;
/**
 * 初始化插件
 *
 * @param config - 插件配置（从 openclaw.json 合并而来）
 * @param gateway - OpenClaw Gateway API
 */
export declare function init(config: PWAChannelConfig, gateway: any): Promise<void>;
/**
 * 处理客户端连接
 *
 * 这个函数会被 Gateway 调用，当有新的 PWA 客户端连接时
 */
export declare function handleClientConnection(ws: WebSocket, request: any): void;
/**
 * 关闭插件
 */
export declare function shutdown(): Promise<void>;
/**
 * 获取插件状态
 */
export declare function getStatus(): any;
export type { PWAChannelConfig, PWAMessage, Session } from './types';
//# sourceMappingURL=index.d.ts.map