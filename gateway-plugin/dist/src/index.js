/**
 * PWA 通道插件入口
 *
 * 这个文件是 OpenClaw Gateway 插件的入口点
 * OpenClaw Gateway 会加载并初始化这个插件
 */
import { PWAChannel } from './channel';
// 插件元数据
export const meta = {
    name: 'pwa-channel',
    version: '0.1.0',
    description: 'PWA channel for OpenClaw Gateway',
    author: 'ClawPWA',
    license: 'MIT'
};
// 默认配置
export const defaultConfig = {
    enabled: true,
    port: 18789,
    path: '/pwa',
    cors: {
        origin: '*',
        credentials: true
    }
};
// 通道实例
let channel = null;
/**
 * 初始化插件
 *
 * @param config - 插件配置（从 openclaw.json 合并而来）
 * @param gateway - OpenClaw Gateway API
 */
export async function init(config = defaultConfig, gateway) {
    console.log('[PWA Plugin] Initializing with config:', config);
    if (!config.enabled) {
        console.log('[PWA Plugin] Disabled, skipping initialization');
        return;
    }
    try {
        // 创建通道实例
        channel = new PWAChannel({
            ...defaultConfig,
            ...config,
            gateway: {
                url: gateway?.wsUrl || 'ws://127.0.0.1:18789'
            }
        });
        // 启动通道
        await channel.start();
        // 注册到 Gateway
        if (gateway?.registerChannel) {
            gateway.registerChannel('pwa', {
                type: 'websocket',
                handler: handleClientConnection,
                config: config
            });
        }
        console.log('[PWA Plugin] Initialized successfully');
    }
    catch (error) {
        console.error('[PWA Plugin] Initialization failed:', error);
        throw error;
    }
}
/**
 * 处理客户端连接
 *
 * 这个函数会被 Gateway 调用，当有新的 PWA 客户端连接时
 */
export function handleClientConnection(ws, request) {
    if (!channel) {
        console.error('[PWA Plugin] Channel not initialized');
        ws.close();
        return;
    }
    // 从请求中提取客户端 ID
    const clientId = extractClientId(request);
    // 处理连接
    channel.handleClientConnection(ws, clientId);
}
/**
 * 从请求中提取客户端 ID
 */
function extractClientId(request) {
    // 尝试从 URL 参数中获取
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    if (clientId) {
        return clientId;
    }
    // 从 headers 中获取
    const headerClientId = request.headers['x-client-id'];
    if (headerClientId) {
        return headerClientId;
    }
    // 生成新的客户端 ID
    return `pwa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * 关闭插件
 */
export async function shutdown() {
    console.log('[PWA Plugin] Shutting down...');
    if (channel) {
        await channel.stop();
        channel = null;
    }
    console.log('[PWA Plugin] Shut down complete');
}
/**
 * 获取插件状态
 */
export function getStatus() {
    return {
        ...meta,
        enabled: channel !== null,
        status: channel?.getStatus() || null
    };
}
//# sourceMappingURL=index.js.map