/**
 * PWA 通道类型定义
 */
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
    SYSTEM = "system"
}
export declare enum MessageDirection {
    INCOMING = "incoming",// 从客户端到 Gateway
    OUTGOING = "outgoing"
}
export interface PWAMessage {
    id: string;
    type: MessageType;
    direction: MessageDirection;
    content: string;
    metadata?: {
        userId?: string;
        sessionId?: string;
        timestamp: number;
        attachments?: Attachment[];
    };
}
export interface Attachment {
    type: string;
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
}
export interface Session {
    id: string;
    userId: string;
    createdAt: number;
    lastActivityAt: number;
    messages: PWAMessage[];
    metadata?: Record<string, any>;
}
export interface WSMessage {
    type: 'message' | 'presence' | 'error' | 'session';
    payload: any;
    timestamp: number;
}
export interface PWAChannelConfig {
    enabled: boolean;
    port?: number;
    path?: string;
    cors?: {
        origin?: string | string[];
        credentials?: boolean;
    };
}
//# sourceMappingURL=types.d.ts.map