# ClawPWA 测试指南

## 快速测试

### 方法一：使用提供的脚本

```bash
# 1. 安装
setup.bat

# 2. 启动
start.bat

# 3. 浏览器会自动打开 http://localhost:3000
```

### 方法二：手动测试

## 步骤 1: 验证 Gateway 插件

### 检查插件是否安装

```bash
dir C:\Users\你的用户名\.openclaw\workspace\skills\pwa-channel
```

应该看到：
- `index.js`
- `channel.js`
- `types.js`
- `index.d.ts`
- `channel.d.ts`
- `types.d.ts`

### 验证配置

```bash
openclaw doctor
```

检查输出中是否有 PWA 通道相关的错误。

## 步骤 2: 启动 Gateway

```bash
openclaw gateway --port 18789 --verbose
```

您应该看到：
```
[OpenClaw] Gateway starting on port 18789...
[OpenClaw] Loading channels...
[OpenClaw] WebSocket server listening on ws://127.0.0.1:18789
```

**如果看到 PWA 通道加载的日志更好！**

## 步骤 3: 启动 PWA 客户端

```bash
cd pwa-client
npm run dev
```

访问 http://localhost:3000

## 步骤 4: 浏览器测试

### 检查连接状态

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页

**期望看到：**
```
[WebSocket] Connected
```

**连接状态显示：**
- ✅ "已连接到 Gateway" - 绿色指示灯
- ❌ "未连接到 Gateway" - 红色指示灯

### 测试消息发送

1. 在输入框输入 "Hello"
2. 点击 "发送" 或按 Enter
3. 观察是否有响应

**期望行为：**
- 消息立即显示在聊天列表中（右侧，橙色）
- 几秒后收到 AI 回复（左侧，白色）
- 加载时显示 "..." 动画

### 检查 WebSocket 通信

1. 打开开发者工具（F12）
2. 切换到 Network 标签页
3. 筛选 WS (WebSocket)
4. 点击 WebSocket 连接
5. 查看 Messages 标签页

**应该看到：**
```
◇ 发送: {"type":"message","payload":{...}}
◇ 接收: {"type":"message","payload":{...}}
```

## 步骤 5: 测试命令

在输入框尝试以下命令：

```
/status
/new
/help
```

应该收到相应的响应。

## 步骤 6: 测试 PWA 功能

### 测试离线功能

1. 打开开发者工具（F12）
2. 切换到 Application 标签页
3. 左侧找到 Service Workers
4. 应该看到已激活的 Service Worker

### 测试安装

1. Chrome/Edge: 点击地址栏的安装图标
2. 或：Application > Manifest > 点击 "Add to home screen"

### 测试响应式设计

1. 打开开发者工具（F12）
2. 点击设备工具栏图标（Ctrl+Shift+M）
3. 选择不同设备（iPhone, iPad, Android 等）
4. 界面应该自适应不同屏幕尺寸

## 常见问题诊断

### 问题：无法连接

**检查清单：**
- [ ] Gateway 是否运行？`openclaw gateway status`
- [ ] 端口是否正确？默认 18789
- [ ] 防火墙是否阻止？
- [ ] 浏览器 Console 是否有错误？

**解决方法：**
```bash
# 停止并重启 Gateway
openclaw gateway stop
openclaw gateway --port 18789 --verbose
```

### 问题：编译错误

**解决方法：**
```bash
cd pwa-client
rmdir /s /q node_modules
rmdir /s /q .vite
npm install
npm run dev
```

### 问题：消息发送失败

**检查：**
1. WebSocket 连接状态（Network > WS）
2. Gateway 日志（`openclaw gateway logs`）
3. 浏览器 Console 错误信息

### 问题：PWA 无法安装

**要求：**
- ✅ 使用 HTTPS 或 localhost
- ✅ 有有效的图标文件
- ✅ Manifest.json 正确

**解决方法：**
1. 创建图标文件（见下文）
2. 清除浏览器缓存
3. 使用隐身模式测试

## 创建图标文件

### 临时方案（使用 SVG）

创建 `pwa-client/public/lobster.svg`：

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y="0.9em" font-size="90">🦞</text>
</svg>
```

### 生成 PNG 图标

1. 使用在线工具：https://realfavicongenerator.net/
2. 或使用 ImageMagick：
```bash
convert -background none -size 512x512 lobster.svg lobster-512.png
convert -background none -size 192x192 lobster.svg lobster-192.png
```

3. 放置到：
- `pwa-client/public/lobster.svg`
- `pwa-client/public/lobster-192.png`
- `pwa-client/public/lobster-512.png`

## 性能测试

### 测试大量消息

在 Console 中运行：
```javascript
// 发送 100 条测试消息
for (let i = 0; i < 100; i++) {
  setTimeout(() => {
    // 这里需要实际的发送逻辑
  }, i * 100);
}
```

### 测试内存使用

1. 打开开发者工具（F12）
2. 切换到 Memory 标签页
3. 拍摄堆快照
4. 发送一些消息
5. 再次拍摄快照
6. 对比内存使用

## 日志级别

### Gateway 日志

```bash
# 详细日志
openclaw gateway --verbose

# 调试日志
openclaw gateway --debug

# 查看日志
openclaw gateway logs --follow
```

### 浏览器日志

在 Console 中设置：
```javascript
// 显示所有日志
localStorage.setItem('debug', 'clawpwa:*')

// 关闭调试
localStorage.removeItem('debug')
```

## 报告问题

如果遇到问题，请提供：

1. **系统信息：**
   - 操作系统版本
   - Node.js 版本 (`node --version`)
   - OpenClaw 版本 (`openclaw --version`)

2. **错误信息：**
   - Gateway 日志 (`openclaw gateway logs`)
   - 浏览器 Console 错误
   - Network 请求信息

3. **配置：**
   - `openclaw.json` 内容（移除敏感信息）
   - `.env` 文件内容（如果有）

4. **复现步骤：**
   - 详细描述如何触发问题

## 成功标准

✅ **基本功能：**
- [ ] 能连接到 Gateway
- [ ] 能发送消息
- [ ] 能接收 AI 回复
- [ ] 消息历史正确显示

✅ **PWA 功能：**
- [ ] Service Worker 已注册
- [ ] 可以安装到桌面
- [ ] 离线时显示缓存内容
- [ ] 响应式设计正常

✅ **稳定性：**
- [ ] 长时间运行无内存泄漏
- [ ] 断线后能自动重连
- [ ] 错误处理正确

测试通过后，您就可以开始使用 ClawPWA 了！🎉
