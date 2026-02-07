# ClawPWA 配置和使用指南

本指南将一步步教您如何在已安装 OpenClaw 的电脑上配置和使用 PWA 客户端。

## 📋 准备工作

首先检查您的 OpenClaw 安装：

```bash
# 检查 OpenClaw 版本
openclaw --version

# 查看 Gateway 状态
openclaw gateway status

# 查看 OpenClaw 配置目录
openclaw doctor
```

您应该能看到 OpenClaw 的配置目录，通常是 `~/.openclaw/`（Windows 上是 `C:\Users\你的用户名\.openclaw\`）

## 🔧 第一步：安装和编译 Gateway 插件

### 1.1 安装依赖

```bash
cd D:\wwwroot\clawpwa\gateway-plugin
npm install
```

### 1.2 编译插件

```bash
npm run build
```

编译成功后，会在 `gateway-plugin/dist/` 目录生成以下文件：
- `index.js`
- `index.d.ts`
- `channel.js`
- `channel.d.ts`
- `types.js`
- `types.d.ts`

### 1.3 复制插件到 OpenClaw skills 目录

**Windows (CMD):**
```cmd
mkdir C:\Users\你的用户名\.openclaw\workspace\skills\pwa-channel
xcopy /E /I dist C:\Users\你的用户名\.openclaw\workspace\skills\pwa-channel
```

**Windows (PowerShell):**
```powershell
$skillsPath = "$env:USERPROFILE\.openclaw\workspace\skills\pwa-channel"
New-Item -ItemType Directory -Force -Path $skillsPath
Copy-Item -Path dist\* -Destination $skillsPath -Recurse
```

**或手动操作：**
1. 打开 `C:\Users\你的用户名\.openclaw\workspace\skills\`
2. 创建新文件夹 `pwa-channel`
3. 将 `gateway-plugin/dist/` 中的所有文件复制到这个文件夹

## ⚙️ 第二步：配置 OpenClaw

### 2.1 找到配置文件

OpenClaw 的配置文件位于：
- **Windows**: `C:\Users\你的用户名\.openclaw\openclaw.json`
- **macOS/Linux**: `~/.openclaw/openclaw.json`

### 2.2 编辑配置文件

打开 `openclaw.json`，添加 PWA 通道配置。如果文件不存在，创建一个新的。

**完整的 openclaw.json 示例：**
```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  },
  "channels": {
    "pwa": {
      "enabled": true,
      "path": "/pwa"
    }
  },
  "gateway": {
    "bind": "loopback",
    "port": 18789
  }
}
```

**如果您已有配置文件**，只需添加 `channels.pwa` 部分：
```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  },
  "channels": {
    "pwa": {
      "enabled": true,
      "path": "/pwa"
    }
    // ... 其他通道配置
  }
  // ... 其他配置
}
```

### 2.3 验证配置

```bash
openclaw doctor
```

检查输出中是否有错误信息。

## 🚀 第三步：重启 OpenClaw Gateway

### 3.1 停止现有 Gateway

```bash
openclaw gateway stop
```

### 3.2 启动 Gateway（前台运行，用于调试）

```bash
openclaw gateway --port 18789 --verbose
```

您应该看到类似这样的输出：
```
[OpenClaw] Gateway starting on port 18789...
[OpenClaw] Loading channels...
[OpenClaw] PWA Channel loaded
[OpenClaw] WebSocket server listening on ws://127.0.0.1:18789
```

### 3.3 后台运行（生产环境）

如果要在后台运行：
```bash
openclaw gateway start
```

查看状态：
```bash
openclaw gateway status
```

查看日志：
```bash
openclaw gateway logs
```

## 📱 第四步：启动 PWA 客户端

### 4.1 安装前端依赖

```bash
cd D:\wwwroot\clawpwa\pwa-client
npm install
```

### 4.2 创建环境配置文件

创建 `pwa-client/.env` 文件：

```bash
# Gateway WebSocket 地址
VITE_GATEWAY_URL=ws://localhost:18789/pwa
```

### 4.3 启动开发服务器

```bash
npm run dev
```

您应该看到：
```
  VITE v6.0.0  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 4.4 打开浏览器

访问：http://localhost:3000

## ✅ 第五步：测试连接

### 5.1 检查连接状态

在浏览器中：
1. 打开 http://localhost:3000
2. 按 F12 打开开发者工具
3. 查看 Console 标签页

您应该看到：
```
[WebSocket] Connected
```

连接状态应该显示 "已连接到 Gateway"

### 5.2 发送测试消息

在输入框中输入 "Hello"，点击发送。

如果一切正常，您会收到 AI 的回复。

### 5.3 查看 WebSocket 消息

在开发者工具中：
1. 切换到 Network 标签页
2. 筛选 WS (WebSocket)
3. 点击 WebSocket 连接
4. 查看 Messages 标签页

您应该能看到发送和接收的消息。

## 🎯 第六步：安装 PWA（可选）

### Chrome/Edge

1. 点击地址栏右侧的安装图标（⊕ 或电脑图标）
2. 或点击地址栏的锁图标 → "安装 ClawPWA"
3. 确认安装

### Safari

1. 点击分享按钮（□↑）
2. 滚动找到 "添加到主屏幕"
3. 点击 "添加"

## 🔍 故障排查

### 问题 1: "无法连接到 Gateway"

**原因：**
- Gateway 未运行
- 端口被占用
- 配置错误

**解决方案：**
```bash
# 1. 检查 Gateway 是否运行
openclaw gateway status

# 2. 如果未运行，启动它
openclaw gateway --port 18789 --verbose

# 3. 检查端口是否被占用
netstat -ano | findstr :18789

# 4. 查看日志
openclaw gateway logs
```

### 问题 2: "PWA 通道未加载"

**原因：**
- 插件未正确复制到 skills 目录
- 配置文件错误

**解决方案：**
```bash
# 1. 检查插件是否存在
ls C:\Users\你的用户名\.openclaw\workspace\skills\pwa-channel

# 2. 应该看到这些文件：
# - index.js
# - channel.js
# - types.js
# - index.d.ts
# - channel.d.ts
# - types.d.ts

# 3. 验证配置
openclaw doctor

# 4. 查看 Gateway 日志
openclaw gateway logs --follow
```

### 问题 3: 前端编译错误

**解决方案：**
```bash
# 清除缓存重新安装
cd pwa-client
rm -rf node_modules
rm -rf .vite
npm install
npm run dev
```

### 问题 4: TypeScript 类型错误

**解决方案：**
```bash
# 安装缺失的类型定义
cd pwa-client
npm install --save-dev @types/node
```

## 📊 验证清单

使用这个清单确保一切正常：

- [ ] Gateway 插件已编译
- [ ] 插件文件已复制到 `~/.openclaw/workspace/skills/pwa-channel/`
- [ ] `openclaw.json` 中已添加 PWA 通道配置
- [ ] `openclaw doctor` 没有错误
- [ ] Gateway 正在运行（`openclaw gateway status`）
- [ ] PWA 客户端依赖已安装
- [ ] 开发服务器正在运行（http://localhost:3000）
- [ ] 浏览器显示 "已连接到 Gateway"
- [ ] 能发送和接收消息

## 🚀 日常使用

### 启动 Gateway

```bash
# 前台运行（调试）
openclaw gateway --port 18789 --verbose

# 后台运行
openclaw gateway start
```

### 启动 PWA 客户端

```bash
cd D:\wwwroot\clawpwa\pwa-client
npm run dev
```

### 停止

```bash
# 停止 Gateway
openclaw gateway stop

# 停止 PWA 客户端：在终端按 Ctrl+C
```

## 📱 生产部署

如果要长期使用，建议：

### 1. 构建生产版本

```bash
cd pwa-client
npm run build
```

### 2. 使用 Nginx 部署

将 `pwa-client/dist/` 目录部署到 Nginx：

```nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/pwa-client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket 代理
    location /pwa {
        proxy_pass http://localhost:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. 设置 Gateway 开机自启

**Windows:**
使用任务计划程序设置开机启动

**macOS/Linux:**
```bash
openclaw onboard --install-daemon
```

## 💡 提示

1. **开发时**：使用 `openclaw gateway --verbose` 可以看到详细日志
2. **调试时**：同时打开 Gateway 和浏览器的开发者工具
3. **性能**：生产环境使用 `npm run build` 构建优化版本
4. **安全**：如果暴露到公网，确保配置认证

## 📚 更多帮助

- 查看详细文档：`docs/INSTALL.md`
- API 参考：`docs/API.md`
- 架构说明：`docs/ARCHITECTURE.md`
- OpenClaw 官方文档：https://docs.openclaw.ai/

---

需要帮助？查看 `openclaw gateway logs` 的输出，通常能找到问题所在。
