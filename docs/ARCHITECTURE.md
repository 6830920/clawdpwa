# ClawPWA 架构文档

## 概述

ClawPWA 是一个为 OpenClaw Gateway 开发的 PWA 通道插件，允许用户通过浏览器或移动设备与 AI 助手进行对话。

## 系统架构

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│   PWA Client    │◄─────────────────────────►│  OpenClaw       │
│  (浏览器/移动端) │                           │  Gateway        │
│                 │                           │                 │
│  - React UI     │                           │  - 路由消息      │
│  - WebSocket    │                           │  - 会话管理      │
│  - Service SW   │                           │  - 通道管理      │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                                       ▼
                                                ┌─────────────┐
                                                │ AI Agent    │
                                                │ (Pi/Claude) │
                                                └─────────────┘
```

## 组件说明

### 1. Gateway 插件 (`gateway-plugin/`)

#### 文件结构
```
gateway-plugin/
├── src/
│   ├── index.ts       # 插件入口，初始化和导出
│   ├── channel.ts     # PWA 通道核心实现
│   └── types.ts       # TypeScript 类型定义
├── dist/              # 编译输出
├── package.json
└── tsconfig.json
```

#### 核心类：PWAChannel

**职责：**
- 管理与 OpenClaw Gateway 的 WebSocket 连接
- 处理来自 PWA 客户端的连接和消息
- 维护会话状态和消息历史
- 路由消息到 AI Agent
- 将 AI 响应返回给客户端

**主要方法：**
- `start()`: 启动通道，连接到 Gateway
- `stop()`: 停止通道，关闭所有连接
- `handleClientConnection()`: 处理新的客户端连接
- `handleClientMessage()`: 处理来自客户端的消息
- `handleAgentResponse()`: 处理 AI Agent 的响应

#### 消息流程

**客户端 → Gateway → AI Agent**
```
1. PWA 客户端发送消息
2. PWAChannel 接收并解析消息
3. 获取或创建会话
4. 将消息转发到 Gateway
5. Gateway 路由到 AI Agent
```

**AI Agent → Gateway → 客户端**
```
1. AI Agent 生成响应
2. Gateway 接收响应
3. 通过 WebSocket 发送到 PWAChannel
4. PWAChannel 找到对应的会话和客户端
5. 将响应发送到 PWA 客户端
```

### 2. PWA 客户端 (`pwa-client/`)

#### 文件结构
```
pwa-client/
├── src/
│   ├── main.tsx                 # 应用入口
│   ├── App.tsx                  # 根组件
│   ├── types.ts                 # 类型定义
│   ├── contexts/
│   │   └── ChatContext.tsx      # 聊天上下文（状态管理）
│   ├── hooks/
│   │   └── useWebSocket.ts      # WebSocket Hook
│   └── components/
│       ├── Header.tsx           # 头部组件
│       ├── ConnectionStatus.tsx # 连接状态
│       ├── Chat.tsx             # 聊天主组件
│       ├── MessageList.tsx      # 消息列表
│       ├── MessageItem.tsx      # 单条消息
│       └── MessageInput.tsx     # 输入框
├── public/
│   ├── manifest.json            # PWA Manifest
│   └── sw.js                    # Service Worker（由 vite-plugin-pwa 生成）
├── index.html
├── vite.config.ts
└── tailwind.config.js
```

#### 核心组件

**ChatContext (Context API)**
- 提供全局聊天状态管理
- 包含：消息列表、加载状态、错误状态、连接状态
- 提供：`sendMessage`、`clearMessages` 方法

**useWebSocket (Custom Hook)**
- 管理 WebSocket 连接
- 自动重连机制
- 消息发送和接收
- 提供消息订阅机制

**组件层次**
```
App
├── ChatProvider (Context)
│   ├── Header
│   ├── ConnectionStatus
│   └── Chat
│       └── MessageList
│           └── MessageItem
│       └── MessageInput
```

## 通信协议

### WebSocket 消息格式

#### 客户端 → Gateway
```typescript
{
  type: 'message',
  payload: {
    channel: 'pwa',
    content: string,
    type: 'text' | 'image' | 'audio' | 'video' | 'file',
    timestamp: number
  }
}
```

#### Gateway → 客户端
```typescript
// 消息
{
  type: 'message',
  payload: {
    content: string,
    sessionId: string
  },
  timestamp: number
}

// 错误
{
  type: 'error',
  payload: {
    error: string
  }
}

// 系统消息
{
  type: 'system',
  payload: {
    message: string,
    clientId: string
  }
}
```

## 数据模型

### Message
```typescript
interface Message {
  id: string              // 唯一 ID
  content: string         // 消息内容
  type: MessageType       // 消息类型
  direction: MessageDirection // 消息方向
  timestamp: number       // 时间戳
  metadata?: {
    sessionId?: string
    userId?: string
    attachments?: Attachment[]
  }
}
```

### Session
```typescript
interface Session {
  id: string              // 会话 ID
  userId: string          // 用户 ID
  createdAt: number       // 创建时间
  lastActivityAt: number  // 最后活动时间
  messages: Message[]     // 消息历史
  metadata?: Record<string, any>
}
```

## PWA 特性

### 1. 安装能力
通过 `manifest.json` 定义，支持：
- 添加到主屏幕
- 独立窗口运行
- 自定义启动画面

### 2. 离线支持
通过 Service Worker 实现：
- 静态资源缓存
- API 响应缓存
- 离线时显示缓存内容

### 3. 推送通知
- Web Push API
- 后台消息接收
- 系统通知显示

### 4. 响应式设计
- 移动端优先
- 自适应布局
- 触摸优化

## 安全考虑

1. **CORS 配置**
   - 配置允许的来源
   - 凭证模式

2. **消息验证**
   - 验证消息格式
   - 限制消息大小
   - 防止注入攻击

3. **会话隔离**
   - 每个用户独立会话
   - 会话 ID 随机生成
   - 支持多会话并行

## 性能优化

1. **WebSocket**
   - 连接池复用
   - 心跳保活
   - 自动重连

2. **消息列表**
   - 虚拟滚动（未来）
   - 消息分页（未来）
   - 懒加载

3. **缓存策略**
   - Service Worker 缓存
   - 本地存储历史消息
   - 智能缓存失效

## 扩展性

### 支持的功能扩展
- 文件上传/下载
- 语音消息
- 图片预览
- 代码高亮
- Markdown 渲染
- 多语言支持
- 主题切换

### 插件系统
- 自定义消息类型
- 自定义 UI 组件
- 中间件机制
