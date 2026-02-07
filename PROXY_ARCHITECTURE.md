# 🏗️ WebSocket 代理架构详解

## 📊 架构对比

### 当前架构（直连模式）

```
┌─────────────────┐                           ┌──────────────────┐
│  浏览器前端      │                           │  OpenClaw        │
│                 │                           │  Gateway         │
│  index.html     │ ────WebSocket──────▶      │  :18789          │
│                 │    (需要token)             │                  │
│  WebSocket      │                           │  认证: token      │
│  Client         │                           │                  │
└─────────────────┘                           └──────────────────┘
      ↓
    知道 token ❌

**问题**：
- Token 暴露在前端 JavaScript 代码中
- 浏览器开发者工具可以看到 token
- XSS 攻击可以窃取 token
```

---

### 目标架构（代理模式）

```
┌─────────────────┐              ┌──────────────────┐         ┌──────────────────┐
│  浏览器前端      │              │   Go 后端         │         │  OpenClaw        │
│                 │              │  (Proxy Server)  │         │  Gateway         │
│  index.html     │──WebSocket──▶│                  │─Token──▶│  :18789          │
│                 │  (无token)   │  :36006           │         │                  │
│  WebSocket      │              │  WebSocket 代理  │         │  认证: token     │
│  Client         │◀──WebSocket──│                  │◀───────│                  │
└─────────────────┘              └──────────────────┘         └──────────────────┘
      ↓                                                            ↓
   不知道 token ✅                                            只有后端知道 token ✅

**优点**：
- 前端完全不知道 token
- Token 安全存储在后端配置文件中
- 可以添加用户认证、权限控制
- 可以记录所有消息的审计日志
```

---

## 🔧 核心实现原理

### 1. Go 后端的双重角色

```go
// 角色 1: WebSocket 服务器（接受前端连接）
upgrader.Upgrade(w, r, nil)  // 接受前端连接，不需要 token

// 角色 2: WebSocket 客户端（连接到 Gateway）
websocket.DefaultDialer.Dial(gatewayURL, nil)  // 连接到 Gateway，使用 token
```

### 2. 双向消息转发

```go
// 前端 → Gateway
func forwardFrontendToBackend(proxy *ProxyConnection) {
    for {
        message, _ := proxy.Frontend.ReadMessage()      // 从前端读取
        proxy.Backend.WriteMessage(message)             // 写入 Gateway
    }
}

// Gateway → 前端
func forwardBackendToFrontend(proxy *ProxyConnection) {
    for {
        message, _ := proxy.Backend.ReadMessage()       // 从 Gateway 读取
        proxy.Frontend.WriteMessage(message)            // 写入前端
    }
}
```

### 3. Gateway 连接认证

```go
// 后端用 token 连接 Gateway
connectMsg := map[string]interface{}{
    "type": "req",
    "id":   "1",
    "method": "connect",
    "params": map[string]interface{}{
        "auth": map[string]string{
            "token": gateway.Token,  // 🔒 Token 在后端！
        },
    },
}
conn.WriteJSON(connectMsg)
```

---

## 📝 关键代码解析

### 步骤 1: 接受前端连接（不需要 token）

```go
func handleProxyWebSocket(w http.ResponseWriter, r *http.Request) {
    // 升级 HTTP 连接为 WebSocket
    frontendConn, _ := upgrader.Upgrade(w, r, nil)

    // 前端连接成功，但不需要 token
    log.Printf("Frontend connected from %s", r.RemoteAddr)
```

### 步骤 2: 后端连接 Gateway（使用 token）

```go
    // 后端连接到 Gateway
    backendConn, _ := connectToGateway(gateway)

    // connectToGateway 函数内部：
    wsUrl := "ws://127.0.0.1:18789/protocol"
    conn, _ := websocket.DefaultDialer.Dial(wsUrl, nil)

    // 发送认证消息（带 token）
    connectMsg := map[string]interface{}{
        "type": "req",
        "method": "connect",
        "params": map[string]interface{}{
            "auth": map[string]string{
                "token": "YOUR-TOKEN-HERE",  // 🔒 Token 在这里！
            },
        },
    }
    conn.WriteJSON(connectMsg)
```

### 步骤 3: 启动双向转发

```go
    // 创建代理连接
    proxy := &ProxyConnection{
        Frontend: frontendConn,  // 前端连接
        Backend:  backendConn,   // Gateway 连接
    }

    // 启动两个 goroutine 进行双向转发
    go forwardFrontendToBackend(proxy)  // 前端 → Gateway
    go forwardBackendToFrontend(proxy)  // Gateway → 前端
```

### 步骤 4: 转发消息

```go
// 前端 → Gateway
func forwardFrontendToBackend(proxy *ProxyConnection) {
    for {
        // 从前端读取消息（例如：chat.send）
        _, message, _ := proxy.Frontend.ReadMessage()

        // 转发到 Gateway（Gateway 看到的是已经认证过的连接）
        proxy.Backend.WriteMessage(websocket.TextMessage, message)
    }
}

// Gateway → 前端
func forwardBackendToFrontend(proxy *ProxyConnection) {
    for {
        // 从 Gateway 读取消息（例如：agent 事件）
        _, message, _ := proxy.Backend.ReadMessage()

        // 转发到前端
        proxy.Frontend.WriteMessage(websocket.TextMessage, message)
    }
}
```

---

## 🎯 前端代码变化

### 之前（直连模式）

```javascript
// 前端需要知道 Gateway 地址和 token
const ws = new WebSocket('ws://127.0.0.1:18789/protocol');

// 前端需要发送认证消息
ws.onopen = () => {
    ws.send(JSON.stringify({
        type: 'req',
        method: 'connect',
        params: {
            auth: {
                token: 'YOUR-TOKEN-HERE'  // ❌ Token 暴露在前端！
            }
        }
    }));
};
```

### 现在（代理模式）

```javascript
// 前端只连接到 Go 后端（不需要 token！）
const ws = new WebSocket('ws://localhost:36006/ws');

// 前端直接发送聊天消息（不需要认证）
ws.onopen = () => {
    console.log('Connected to proxy server');

    // 发送消息（后端会自动处理认证）
    ws.send(JSON.stringify({
        method: 'chat.send',
        params: {
            message: 'Hello'
        }
    }));
};

// 接收消息（后端已经完成了认证和转发）
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log('Received:', msg);
};
```

**关键变化**：
- ✅ 前端不知道 token
- ✅ 前端不需要发送认证消息
- ✅ 前端只知道连接到 `ws://localhost:36006/ws`

---

## 🔒 安全优势

### 1. Token 隐藏

```bash
# 浏览器开发者工具 - Network 标签
# 之前：
WebSocket URL: ws://127.0.0.1:18789/protocol
Sent: {"type":"req","method":"connect","params":{"auth":{"token":"ABC123..."}}}
         ↑ Token 暴露！

# 现在：
WebSocket URL: ws://localhost:36006/ws
Sent: {"method":"chat.send","params":{"message":"Hello"}}
         ↑ 没有 token！
```

### 2. 可添加认证层

```go
// 在接受前端连接前，可以验证用户身份
func handleProxyWebSocket(w http.ResponseWriter, r *http.Request) {
    // 检查 Session / JWT Token
    sessionToken := r.Header.Get("Authorization")
    if !validateSession(sessionToken) {
        http.Error(w, "Unauthorized", 401)
        return
    }

    // 认证通过，升级 WebSocket
    frontendConn, _ := upgrader.Upgrade(w, r, nil)
```

### 3. 审计日志

```go
// 记录所有消息
func forwardFrontendToBackend(proxy *ProxyConnection) {
    for {
        message, _ := proxy.Frontend.ReadMessage()

        // 🔍 记录审计日志
        log.Printf("[AUDIT] Frontend → Gateway: %s", string(message))

        proxy.Backend.WriteMessage(message)
    }
}
```

---

## 📦 依赖变化

需要添加 WebSocket 库：

```bash
go get github.com/gorilla/websocket
```

```go
import "github.com/gorilla/websocket"
```

---

## 🚀 部署变化

### 之前
```bash
# 前端直连 Gateway
clawchat.exe -g ws://gateway-server:18789 -t TOKEN
```

### 现在
```bash
# 后端配置 token（前端不需要知道）
clawchat.exe -mode proxy -g ws://gateway-server:18789 -t TOKEN
```

前端访问：`http://localhost:36006/`
- 前端连接到：`ws://localhost:36006/ws`
- 后端连接到：`ws://gateway-server:18789`（带 token）

---

## 💡 实现建议

### 阶段 1: 保持当前方案（直连）
- 适合：个人使用、内网部署
- 优点：简单、无额外复杂度

### 阶段 2: 实现代理模式（上面的代码）
- 适合：多人使用、公网部署
- 优点：Token 安全、可扩展

### 阶段 3: 添加认证层
- 在代理模式基础上添加用户认证
- 可以集成 JWT、Session、OAuth 等

---

## 🤔 是否需要切换到代理模式？

### 不需要切换的情况：
- ✅ 个人使用
- ✅ 内网部署
- ✅ Token 只是测试用
- ✅ 不担心 token 泄露

### 需要切换的情况：
- ⚠️ 公网部署
- ⚠️ 多用户访问
- ⚠️ Token 有权限限制
- ⚠️ 需要审计日志
- ⚠️ 需要用户认证

---

## 📝 总结

**代理模式的核心**：
1. Go 后端同时扮演 WebSocket 服务器和客户端
2. 前端连接到后端（无 token）
3. 后端连接到 Gateway（有 token）
4. 后端双向转发消息

**实现复杂度**：
- 中等（~200 行 Go 代码）
- 需要理解 WebSocket 双向通信
- 需要处理并发和连接管理

**安全提升**：
- Token 完全隐藏
- 可添加用户认证
- 可记录审计日志

---

**需要我帮你实现完整的代理模式吗？** 还是保持当前的直连模式？
