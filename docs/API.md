# ClawPWA API 文档

## Gateway 插件 API

### 导出函数

#### `init(config, gateway)`

初始化 PWA 通道插件。

**参数：**
- `config: PWAChannelConfig` - 插件配置
- `gateway: GatewayAPI` - OpenClaw Gateway API

**返回：** `Promise<void>`

**示例：**
```typescript
import { init } from '@clawpwa/gateway-plugin'

await init({
  enabled: true,
  port: 18789,
  path: '/pwa'
}, gateway)
```

#### `shutdown()`

关闭 PWA 通道插件。

**返回：** `Promise<void>`

**示例：**
```typescript
import { shutdown } from '@clawpwa/gateway-plugin'

await shutdown()
```

#### `getStatus()`

获取插件状态。

**返回：**
```typescript
{
  name: string
  version: string
  enabled: boolean
  status: {
    connected: boolean
    clients: number
    sessions: number
  }
}
```

### 类：PWAChannel

#### 构造函数

```typescript
new PWAChannel(config: PWAChannelConfig)
```

#### 方法

##### `start(): Promise<void>`

启动 PWA 通道，连接到 Gateway。

##### `stop(): Promise<void>`

停止 PWA 通道，关闭所有连接。

##### `handleClientConnection(ws: WebSocket, clientId: string): void`

处理来自 PWA 客户端的 WebSocket 连接。

##### `getStatus(): any`

获取通道状态信息。

## PWA 客户端 API

### Hooks

#### `useChat()`

聊天上下文 Hook。

**返回：**
```typescript
{
  state: ChatState
  sendMessage: (content: string, type?: string) => void
  clearMessages: () => void
}
```

**示例：**
```typescript
import { useChat } from '../contexts/ChatContext'

function MyComponent() {
  const { state, sendMessage } = useChat()

  return (
    <div>
      <p>消息数: {state.messages.length}</p>
      <button onClick={() => sendMessage('Hello')}>
        发送消息
      </button>
    </div>
  )
}
```

#### `useWebSocket(config?)`

WebSocket 连接 Hook。

**参数：**
- `config?: Partial<WebSocketConfig>` - 可选配置

**返回：**
```typescript
{
  connected: boolean
  sendMessage: (data: any) => void
  onMessage: (handler: (msg: WSMessage) => void) => () => void
  connect: () => void
  disconnect: () => void
}
```

**示例：**
```typescript
import { useWebSocket } from '../hooks/useWebSocket'

function MyComponent() {
  const { connected, sendMessage, onMessage } = useWebSocket({
    url: 'ws://localhost:18789/pwa',
    reconnectInterval: 3000
  })

  useEffect(() => {
    const unsubscribe = onMessage((msg) => {
      console.log('收到消息:', msg)
    })
    return unsubscribe
  }, [onMessage])

  return <div>{connected ? '已连接' : '未连接'}</div>
}
```

### 组件

#### `<ChatProvider>`

聊天上下文 Provider。

**Props：**
- `children: React.ReactNode`

**示例：**
```typescript
import { ChatProvider } from '../contexts/ChatContext'

function App() {
  return (
    <ChatProvider>
      <YourComponents />
    </ChatProvider>
  )
}
```

#### `<Header>`

应用头部组件。

**示例：**
```typescript
import Header from '../components/Header'

<Header />
```

#### `<ConnectionStatus>`

连接状态显示组件。

**示例：**
```typescript
import ConnectionStatus from '../components/ConnectionStatus'

<ConnectionStatus />
```

#### `<Chat>`

聊天主组件，包含消息列表和输入框。

**示例：**
```typescript
import Chat from '../components/Chat'

<Chat />
```

#### `<MessageList>`

消息列表组件。

**Props：**
- `messages: Message[]`
- `loading: boolean`

**示例：**
```typescript
import MessageList from '../components/MessageList'

<MessageList messages={messages} loading={loading} />
```

#### `<MessageItem>`

单条消息组件。

**Props：**
- `message: Message`

**示例：**
```typescript
import MessageItem from '../components/MessageItem'

<MessageItem message={message} />
```

#### `<MessageInput>`

消息输入框组件。

**Props：**
- `disabled?: boolean`

**示例：**
```typescript
import MessageInput from '../components/MessageInput'

<MessageInput disabled={!connected} />
```

## 类型定义

### Message

```typescript
interface Message {
  id: string
  content: string
  type: MessageType
  direction: MessageDirection
  timestamp: number
  metadata?: {
    sessionId?: string
    userId?: string
    attachments?: Attachment[]
  }
}
```

### MessageType

```typescript
enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
  SYSTEM = 'system'
}
```

### MessageDirection

```typescript
enum MessageDirection {
  INCOMING = 'incoming',  // 客户端 → Gateway
  OUTGOING = 'outgoing'   // Gateway → 客户端
}
```

### ChatState

```typescript
interface ChatState {
  messages: Message[]
  loading: boolean
  error: string | null
  connected: boolean
}
```

### WSMessage

```typescript
interface WSMessage {
  type: 'message' | 'presence' | 'error' | 'session' | 'system'
  payload: any
  timestamp?: number
}
```

### WebSocketConfig

```typescript
interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  heartbeatInterval?: number
}
```

### Attachment

```typescript
interface Attachment {
  type: string
  url: string
  name?: string
  size?: number
  mimeType?: string
}
```

### Session

```typescript
interface Session {
  id: string
  userId: string
  createdAt: number
  lastActivityAt: number
  messages: Message[]
  metadata?: Record<string, any>
}
```

### PWAChannelConfig

```typescript
interface PWAChannelConfig {
  enabled: boolean
  port?: number
  path?: string
  cors?: {
    origin?: string | string[]
    credentials?: boolean
  }
}
```

## WebSocket 消息协议

### 客户端 → Gateway

#### 发送消息

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

### Gateway → 客户端

#### 接收消息

```typescript
{
  type: 'message',
  payload: {
    content: string,
    sessionId: string
  },
  timestamp: number
}
```

#### 错误消息

```typescript
{
  type: 'error',
  payload: {
    error: string
  }
}
```

#### 系统消息

```typescript
{
  type: 'system',
  payload: {
    message: string,
    clientId: string
  }
}
```

#### 连接状态

```typescript
{
  type: 'presence',
  payload: {
    connected: boolean
  }
}
```

#### 会话更新

```typescript
{
  type: 'session',
  payload: {
    sessionId: string,
    // ... 其他会话数据
  }
}
```

## 命令

OpenClaw 支持的聊天命令（在消息框中输入）：

- `/status` - 查看会话状态
- `/new` 或 `/reset` - 重置会话
- `/compact` - 压缩会话上下文
- `/think <level>` - 设置思考级别（off|minimal|low|medium|high|xhigh）
- `/verbose on|off` - 切换详细模式
- `/usage off|tokens|full` - 显示使用统计
- `/restart` - 重启 Gateway（仅群组所有者）
- `/activation mention|always` - 切换群组激活模式（仅群组）

## 扩展 API

### 自定义消息类型

要添加新的消息类型，需要：

1. 在 `gateway-plugin/src/types.ts` 中添加 `MessageType`
2. 在 `pwa-client/src/types.ts` 中同步添加
3. 更新消息处理逻辑

### 自定义 UI 组件

可以使用提供的 Context 和 Hooks 构建自定义 UI：

```typescript
import { useChat } from '../contexts/ChatContext'

function CustomChat() {
  const { state, sendMessage } = useChat()

  return (
    <div>
      {state.messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value)
          }
        }}
      />
    </div>
  )
}
```

### 中间件（未来功能）

计划支持消息中间件：

```typescript
interface Middleware {
  (message: Message, next: () => void): void
}

function logger(message: Message, next: () => void) {
  console.log('消息:', message)
  next()
}

function filter(message: Message, next: () => void) {
  if (message.content.includes('敏感词')) {
    return
  }
  next()
}
```
